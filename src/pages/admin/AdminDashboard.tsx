import { useProperties } from '../../hooks/useProperties';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc, getDoc, setDoc, onSnapshot, serverTimestamp, Timestamp, where } from 'firebase/firestore';
import { app, db } from '../../firebase';
import { Loader2, Trash2, Edit, Plus, LogOut, Phone, Mail, MessageSquare, RefreshCw, LayoutDashboard, List, ExternalLink, Upload, BedDouble, Ruler, Building2, Download, Bell, BellRing, Sparkles, Camera, MapPin, X, MoreHorizontal, FileText, ChevronRight } from 'lucide-react';
import { uploadImage } from '../../utils/uploadImage';
import { createSlug } from '../../utils/slugify';
import type { Property } from '../../data/properties';
import './AdminDashboard.css';
import './admin-theme.css';
import { ClientAccountCreator } from './ClientAccountCreator';
import { AcquisitionCallCard } from './AcquisitionCallCard';
import { AdminTabBar } from './AdminTabBar';
import { CallQueuePanel } from './CallQueuePanel';
import { CONSENT_TTL_MS, buildConsentLink, buildOwnerConsentFields, callbackDateToIso, consentCardStatus, consentForLead, formatCallNote, newConsentToken, stageAfterConsentLink, stageForCallResult } from './callCardLogic';
import type { CallResultId, OwnerConsentLike } from './callCardLogic';
import { EXTRA_LISTING_SOURCES, buildCallQueue, hasFinishedAudit, isOldUnpublishedImport, isPrivateAdvertiser, listingSourceKey, publishBlockReason, shouldCreateConsentDraft, stageAfterConfirmedConsent } from './workflowQueue';

type PipelineStage = 'new' | 'qualified' | 'contacted' | 'presentation' | 'negotiation' | 'won' | 'lost';
type StoredLeadStatus = PipelineStage | 'closed';

const PIPELINE_STAGES: Array<{ id: PipelineStage; label: string; color: string; background: string; border: string }> = [
    { id: 'new', label: 'Nowe', color: '#0e7490', background: '#ecfeff', border: '#67e8f9' },
    { id: 'qualified', label: 'Kwalifikacja', color: '#7c3aed', background: '#f5f3ff', border: '#c4b5fd' },
    { id: 'contacted', label: 'Kontakt', color: '#1d4ed8', background: '#eff6ff', border: '#93c5fd' },
    { id: 'presentation', label: 'Prezentacja', color: '#c2410c', background: '#fff7ed', border: '#fdba74' },
    { id: 'negotiation', label: 'Negocjacje', color: '#b45309', background: '#fffbeb', border: '#fcd34d' },
    { id: 'won', label: 'Wygrane', color: '#047857', background: '#ecfdf5', border: '#86efac' },
    { id: 'lost', label: 'Utracone', color: '#b91c1c', background: '#fef2f2', border: '#fca5a5' },
];

interface Inquiry {
    id: string;
    type?: string;
    name?: string;
    email?: string;
    phone?: string;
    message?: string;
    source?: string;
    createdAt?: string;
    leadStatus?: StoredLeadStatus;
    adminNote?: string;
    owner?: string;
    followUpDate?: string;
    payload?: {
        title?: string;
        location?: string;
        type?: string;
        status?: string;
        packageId?: string;
        packageName?: string;
        services?: string[];
        clientPortal?: boolean;
        [key: string]: unknown;
    };
}

interface PwaInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface LeadDraft {
    owner: string;
    followUpDate: string;
    adminNote: string;
}

interface NewLeadDraft {
    name: string;
    email: string;
    phone: string;
    source: string;
    leadStatus: PipelineStage;
    owner: string;
    followUpDate: string;
    message: string;
}

const EMPTY_NEW_LEAD: NewLeadDraft = {
    name: '', email: '', phone: '', source: 'CRM — ręcznie', leadStatus: 'new', owner: '', followUpDate: '', message: '',
};

type AcquisitionStage = 'new' | 'audit' | 'ready_to_call' | 'contacted' | 'consent_draft' | 'meeting' | 'proposal' | 'acquired' | 'nurture' | 'rejected';
interface AcquisitionNote { id: string; text: string; createdAt: string; author: string; }
interface AuditScores { photos: number; description: number; price: number; positioning: number; completeness?: number; conversion?: number; }
interface AuditDraft {
    photos: string;
    description: string;
    price: string;
    targetAudience: string;
    actionPlan: string;
    overallScore?: number;
    scores?: AuditScores;
    strengths?: string[];
    risks?: string[];
    quickWins?: string[];
    contactAngle?: string;
    recommendedHeadline?: string;
    auditVerdict?: string;
    dataQualityNote?: string;
    buyerPersona?: string;
    buyerObjections?: string[];
    missingInformation?: string[];
    photoPlan?: string[];
    marketingChannels?: string[];
    pricingRecommendation?: string;
    differentiationStrategy?: string;
    contactQuestions?: string[];
    sevenDayPlan?: string[];
    recommendedNextStep?: string;
    estimatedSalePrice?: string;
    estimatedSalePriceRange?: string;
    estimatedTimeToSell?: string;
    estimateConfidence?: string;
    estimateRationale?: string;
    estimateAssumptions?: string[];
}
type AuditLanguage = 'pl' | 'en';
interface LocalizedAudit { auditData: AuditDraft; auditSummary: string; }
interface AuditVersion { id: string; generatedAt: string; auditData: AuditDraft; auditSummary: string; auditTranslations?: Partial<Record<AuditLanguage, LocalizedAudit>>; agentComments?: string; }
interface AuditFeedback { id: string; text: string; createdAt: string; author: string; }
interface ShowcasePhotoPlaceholder { id: string; title: string; description: string; }
interface ShowcaseOffer {
    title: string;
    subtitle: string;
    description: string;
    highlights: string[];
    photoPlaceholders: ShowcasePhotoPlaceholder[];
    generatedAt: string;
}
interface AcquisitionTask { id: string; title: string; dueDate: string; owner: string; status: 'open' | 'done'; createdAt: string; }
interface AcquisitionActivity { id: string; type: 'call' | 'sms' | 'email' | 'meeting' | 'other'; summary: string; createdAt: string; author: string; }
interface AcquisitionAttachment { id: string; name: string; url: string; uploadedAt: string; }
interface AcquisitionStageHistory { id: string; stage: AcquisitionStage; label: string; note?: string; createdAt: string; author: string; }
interface CrmNotification { id: string; type: 'overdue' | 'today' | 'decision' | 'audit' | 'stale'; title: string; body: string; leadId: string; assignee?: string; date?: string; priority: number; }
type CooperationPackage = 'start' | 'premium' | 'signature';
interface ProposalDraft { packageVariant: CooperationPackage; selectedServices: string[]; scope: string; commission: string; agreementType: string; decisionDate: string; }
interface ProposalDecision { outcome: 'accepted' | 'considering' | 'declined'; note: string; decidedAt: string; }
interface GeneratedCooperationDocument {
    content: string;
    generatedAt: string;
    updatedAt: string;
    generatedBy: string;
    versionId?: string;
    versionNumber?: number;
    gamma?: {
        generationId?: string;
        gammaId?: string;
        gammaUrl?: string;
        exportUrl?: string;
        status?: string;
        error?: string;
        jobId?: string;
        createdAt?: string;
        updatedAt?: string;
        createdBy?: string;
        publishedAt?: string;
    };
    google?: {
        docId?: string;
        docsUrl?: string;
        viewUrl?: string;
        exportUrl?: string;
        status?: string;
        error?: string;
        jobId?: string;
        createdAt?: string;
        updatedAt?: string;
        createdBy?: string;
    };
}
type CooperationDocumentKind = 'proposal' | 'agreement';
type CallOutcome = 'no_answer' | 'interested' | 'meeting' | 'not_now' | 'not_interested';
const AI_AUDIT_ENABLED = true;
const PROPERTY_CARETAKERS = ['Tomasz Gnat', 'Adrian Huber'] as const;
const COOPERATION_PACKAGES: Record<CooperationPackage, { label: string; shortDescription: string; scope: string; highlights: string[] }> = {
    start: {
        label: 'Start — profesjonalne uruchomienie sprzedaży',
        shortDescription: 'Solidna podstawa: przygotowanie oferty, prezentacja i sprawna obsługa sprzedaży.',
        highlights: [
            'Analiza ceny i strategii sprzedaży',
            'Profesjonalna sesja zdjęciowa',
            'Opis oraz publikacja ogłoszenia',
            'Obsługa zapytań i prezentacji',
            'Wsparcie w negocjacjach',
            'Bieżące podsumowania zainteresowania'
        ],
        scope: `WARIANT START — PROFESJONALNE URUCHOMIENIE SPRZEDAŻY
• Analiza ceny i strategii sprzedaży — analiza rynku, konkurencyjnych ogłoszeń i potencjału mieszkania do wyznaczenia ceny i planu startu.
• Profesjonalna sesja zdjęciowa — sesja wnętrz z kluczowymi atutami nieruchomości oraz wskazówki przygotowania przed sesją.
• Opis oraz publikacja ogłoszenia — opracowanie treści sprzedażowych, dobór zdjęć i publikacja oferty w ustalonych kanałach.
• Obsługa zapytań i prezentacji — odbieranie zapytań, wstępna kwalifikacja klientów oraz profesjonalna organizacja prezentacji.
• Wsparcie w negocjacjach — ocena ofert, pomoc w przygotowaniu odpowiedzi i prowadzenie rozmów do bezpiecznych ustaleń.
• Bieżące podsumowania zainteresowania — informacje o liczbie zapytań, prezentacjach, feedbacku i rekomendowanych kolejnych krokach.`,
    },
    premium: {
        label: 'Premium — aktywna sprzedaż',
        shortDescription: 'Najbardziej uniwersalny wariant: pełna prezentacja i aktywne dotarcie do kupujących.',
        highlights: [
            'Wszystko z wariantu Start',
            'Konsultacja home stagingowa',
            'Film promocyjny i materiały social media',
            'Kampania reklamowa i dotarcie do bazy klientów',
            'Cykliczne raporty oraz rekomendacje zmian'
        ],
        scope: `WARIANT PREMIUM — AKTYWNA SPRZEDAŻ
Obejmuje cały zakres wariantu Start oraz dodatkowo:
• Konsultacja home stagingowa — wskazanie co uporządkować, ukryć lub wyeksponować przed sesją i wizytami.
• Film promocyjny i materiały social media — krótkie formaty wideo i materiały promocyjne dopasowane do mediów społecznościowych.
• Kampania reklamowa i dotarcie do bazy klientów — płatna promocja oraz bezpośredni kontakt z pasującymi kupującymi z naszej bazy.
• Cykliczne raporty oraz rekomendacje zmian — podsumowania efektów promocji oraz bieżące dopasowywanie strategii lub ceny.`,
    },
    signature: {
        label: 'Signature — maksymalna ekspozycja',
        shortDescription: 'Indywidualna strategia i najszersza promocja dla nieruchomości, które mają się wyróżnić.',
        highlights: [
            'Wszystko z wariantu Premium',
            'Indywidualny plan premiery oferty',
            'Rozszerzona sesja i krótkie formaty wideo',
            'Materiały ofertowe PL / EN / IT',
            'Spacer 3D lub dron — gdy ma to sens'
        ],
        scope: `WARIANT SIGNATURE — MAKSYMALNA EKSPOZYCJA
Obejmuje cały zakres wariantu Premium oraz dodatkowo:
• Indywidualny plan premiery oferty — ustalenie kolejności publikacji, komunikacji i mocnego wejścia oferty na rynek.
• Rozszerzona sesja i krótkie formaty wideo — szerszy kadraż zdjęciowy i dedykowane ujęcia pokazujące pełny potencjał przestrzeni.
• Materiały ofertowe PL / EN / IT — wielojęzyczne opracowanie ogłoszenia pozwalające dotrzeć do klientów zagranicznych.
• Spacer 3D lub dron — przygotowanie wirtualnego spaceru lub ujęć z powietrza, tam gdzie realnie podnosi to wartość prezentacji.`,
    },
};
// These are the same service choices shown in the client portal.  Keeping the
// list here makes the CRM proposal independent from a client-portal submission.
const PROPOSAL_SERVICE_OPTIONS: Array<{ package: CooperationPackage; service: string }> = [
    { package: 'start', service: 'Przygotowanie oferty i rekomendacja ceny' },
    { package: 'start', service: 'Profesjonalna sesja zdjęciowa' },
    { package: 'start', service: 'Opis oraz publikacja ogłoszenia' },
    { package: 'start', service: 'Obsługa zapytań i prezentacji' },
    { package: 'start', service: 'Wsparcie w negocjacjach' },
    { package: 'premium', service: 'Wszystko z wariantu podstawowego' },
    { package: 'premium', service: 'Konsultacja home stagingowa' },
    { package: 'premium', service: 'Film promocyjny i materiały social media' },
    { package: 'premium', service: 'Kampania reklamowa i dotarcie do bazy klientów' },
    { package: 'premium', service: 'Cykliczne raporty oraz strategia promocji' },
    { package: 'signature', service: 'Wszystko z wariantu Premium' },
    { package: 'signature', service: 'Indywidualny plan premiery oferty' },
    { package: 'signature', service: 'Rozszerzona sesja i krótkie formaty wideo' },
    { package: 'signature', service: 'Materiały ofertowe PL / EN / IT' },
    { package: 'signature', service: 'Spacer 3D lub dron — gdy ma to sens' },
];
const proposalPackageChain = (variant: CooperationPackage): CooperationPackage[] => variant === 'signature'
    ? ['start', 'premium', 'signature']
    : variant === 'premium' ? ['start', 'premium'] : ['start'];
const inheritedServiceLabels = new Set(['Wszystko z wariantu podstawowego', 'Wszystko z wariantu Start', 'Wszystko z wariantu Premium']);
const proposalServicesForPackage = (variant: CooperationPackage) => PROPOSAL_SERVICE_OPTIONS
    .filter((option) => proposalPackageChain(variant).includes(option.package) && !inheritedServiceLabels.has(option.service))
    .map((option) => option.service);
const expandProposalServices = (variant: CooperationPackage, services: string[]) => {
    const expanded = new Set(services.filter((service) => !inheritedServiceLabels.has(service)));
    if (services.some((service) => service === 'Wszystko z wariantu podstawowego' || service === 'Wszystko z wariantu Start')) {
        proposalServicesForPackage('start').forEach((service) => expanded.add(service));
    }
    if (services.includes('Wszystko z wariantu Premium')) {
        proposalServicesForPackage('premium').forEach((service) => expanded.add(service));
    }
    const allowed = proposalServicesForPackage(variant);
    return allowed.filter((service) => expanded.has(service));
};
const defaultProposalServices = (variant: CooperationPackage) => proposalServicesForPackage(variant);
const buildProposalScope = (variant: CooperationPackage, services: string[]) => {
    const expandedServices = expandProposalServices(variant, services);
    if (!expandedServices.length) return '';
    return `${COOPERATION_PACKAGES[variant].label.toUpperCase()} — ZAKRES WYBRANY DO PROPOSALU\n${expandedServices.map((service) => `• ${service}`).join('\n')}`;
};
const READ_NOTIFICATIONS_KEY = 'domiz.crm.read-notifications.v1';
const PUSH_NOTIFICATIONS_KEY = 'domiz.crm.browser-notifications.v1';
const SHOWN_NOTIFICATIONS_KEY = 'domiz.crm.shown-notifications.v1';
const NOTIFICATION_CARETAKER_KEY = 'domiz.crm.notification-caretaker.v1';
const NOTIFICATION_DEVICE_KEY = 'domiz.crm.notification-device.v1';
const FIREBASE_VAPID_PUBLIC_KEY = 'BAoEGGKviWcQA_JbENsnKivG2Mf9AfV3FjSQATEJY7MQfG9TwXoTE1KOQvvYjvI7xnV4Rzd1aGr0LCX4u5FHWRg';
const getListingSource = (url: URL | string) => {
    const hostname = (typeof url === 'string' ? url : url.hostname).toLowerCase();
    if (hostname.includes('otodom.pl')) return 'Otodom';
    if (hostname.includes('olx.pl')) return 'OLX';
    if (hostname.includes('facebook.com') || hostname.includes('fb.com') || hostname.includes('fb.me')) return 'Facebook';
    return '';
};
const parseCurrencyValue = (value?: string) => {
    const match = value?.match(/\d[\d\s.]*/);
    return match ? Number(match[0].replace(/\D/g, '')) || 0 : 0;
};
interface PropertyLead {
    id: string;
    url: string;
    sourceText?: string;
    title?: string;
    location?: string;
    price?: string;
    note?: string;
    source?: string;
    stage?: AcquisitionStage;
    createdAt?: string;
    updatedAt?: string;
    ownerName?: string;
    ownerPhone?: string;
    assignee?: string;
    areaM2?: number;
    rooms?: number;
    isFavorite?: boolean;
    activePropertyId?: number;
    draftPropertyId?: number;
    notes?: AcquisitionNote[];
    tasks?: AcquisitionTask[];
    activities?: AcquisitionActivity[];
    attachments?: AcquisitionAttachment[];
    stageHistory?: AcquisitionStageHistory[];
    proposal?: ProposalDraft & { preparedAt: string };
    proposalDecision?: ProposalDecision;
    generatedProposal?: GeneratedCooperationDocument;
    proposalVersions?: Array<GeneratedCooperationDocument & { id: string }>;
    generatedAgreement?: GeneratedCooperationDocument;
    sourceDetails?: {
        pricePerM2?: string; heating?: string; floor?: string; rent?: string; finishCondition?: string; market?: string; ownership?: string; availableFrom?: string; advertiserType?: string; buildingElevator?: string; buildingType?: string; windows?: string;
    };
    lastContactAt?: string;
    callResult?: CallResultId;
    callbackAt?: string;
    lastCallAt?: string;
    ownerConsentId?: string;
    auditedAt?: string;
    auditSummary?: string;
    auditData?: AuditDraft;
    auditVersions?: AuditVersion[];
    auditTranslations?: Partial<Record<AuditLanguage, LocalizedAudit>>;
    auditFeedback?: AuditFeedback[];
    showcaseOffer?: ShowcaseOffer;
    showcaseOfferTranslations?: Partial<Record<AuditLanguage, ShowcaseOffer>>;
    nextAction?: string;
    nextActionDate?: string;
    currentBroker?: string;
    agreementEnds?: string;
    propertyDraft?: {
        title: string;
        price: number;
        location: string;
        beds: number;
        baths: number;
        sqft: number;
        type: 'dom' | 'mieszkanie' | 'dzialka';
        status: 'sprzedaz' | 'wynajem';
        description: string;
        features: string[];
        image: string;
        images: string[];
        featured: boolean;
        agent: { name: string; phone: string; email: string; image: string };
    };
}
interface NewPropertyLeadDraft {
    url: string;
    title: string;
    location: string;
    price: string;
    note: string;
    ownerName: string;
    ownerPhone: string;
    assignee: string;
    areaM2: string;
    rooms: string;
    sourceText: string;
    baths: string;
    type: 'dom' | 'mieszkanie' | 'dzialka';
    status: 'sprzedaz' | 'wynajem';
    features: string;
    pricePerM2: string;
    heating: string;
    floor: string;
    rent: string;
    finishCondition: string;
    market: string;
    ownership: string;
    availableFrom: string;
    advertiserType: string;
    buildingElevator: string;
    buildingType: string;
    windows: string;
    image: string;
    images: string[];
}
const EMPTY_PROPERTY_LEAD: NewPropertyLeadDraft = { url: '', sourceText: '', title: '', location: '', price: '', note: '', ownerName: '', ownerPhone: '', assignee: '', areaM2: '', rooms: '', baths: '', type: 'mieszkanie', status: 'sprzedaz', features: '', pricePerM2: '', heating: '', floor: '', rent: '', finishCondition: '', market: '', ownership: '', availableFrom: '', advertiserType: '', buildingElevator: '', buildingType: '', windows: '', image: '', images: [] };

const AUDIT_CONTENT_SCHEMA = {
    type: 'OBJECT',
    properties: {
        photos: { type: 'STRING' }, description: { type: 'STRING' }, price: { type: 'STRING' }, targetAudience: { type: 'STRING' }, actionPlan: { type: 'STRING' }, summary: { type: 'STRING' }, overallScore: { type: 'INTEGER' },
        scores: { type: 'OBJECT', properties: { photos: { type: 'INTEGER' }, description: { type: 'INTEGER' }, price: { type: 'INTEGER' }, positioning: { type: 'INTEGER' }, completeness: { type: 'INTEGER' }, conversion: { type: 'INTEGER' } }, required: ['photos', 'description', 'price', 'positioning', 'completeness', 'conversion'] },
        strengths: { type: 'ARRAY', items: { type: 'STRING' } }, risks: { type: 'ARRAY', items: { type: 'STRING' } }, quickWins: { type: 'ARRAY', items: { type: 'STRING' } }, contactAngle: { type: 'STRING' }, recommendedHeadline: { type: 'STRING' }, auditVerdict: { type: 'STRING' }, dataQualityNote: { type: 'STRING' }, buyerPersona: { type: 'STRING' }, buyerObjections: { type: 'ARRAY', items: { type: 'STRING' } }, missingInformation: { type: 'ARRAY', items: { type: 'STRING' } }, photoPlan: { type: 'ARRAY', items: { type: 'STRING' } }, marketingChannels: { type: 'ARRAY', items: { type: 'STRING' } }, pricingRecommendation: { type: 'STRING' }, differentiationStrategy: { type: 'STRING' }, contactQuestions: { type: 'ARRAY', items: { type: 'STRING' } }, sevenDayPlan: { type: 'ARRAY', items: { type: 'STRING' } }, recommendedNextStep: { type: 'STRING' }, estimatedSalePrice: { type: 'STRING' }, estimatedSalePriceRange: { type: 'STRING' }, estimatedTimeToSell: { type: 'STRING' }, estimateConfidence: { type: 'STRING' }, estimateRationale: { type: 'STRING' }, estimateAssumptions: { type: 'ARRAY', items: { type: 'STRING' } },
    },
    required: ['photos', 'description', 'price', 'targetAudience', 'actionPlan', 'summary', 'overallScore', 'scores', 'strengths', 'risks', 'quickWins', 'contactAngle', 'recommendedHeadline', 'auditVerdict', 'dataQualityNote', 'buyerPersona', 'buyerObjections', 'missingInformation', 'photoPlan', 'marketingChannels', 'pricingRecommendation', 'differentiationStrategy', 'contactQuestions', 'sevenDayPlan', 'recommendedNextStep', 'estimatedSalePrice', 'estimatedSalePriceRange', 'estimatedTimeToSell', 'estimateConfidence', 'estimateRationale', 'estimateAssumptions'],
};

const SHOWCASE_OFFER_SCHEMA = {
    type: 'OBJECT',
    properties: {
        title: { type: 'STRING' },
        subtitle: { type: 'STRING' },
        descriptionParagraphs: { type: 'ARRAY', items: { type: 'STRING' } },
        highlights: { type: 'ARRAY', items: { type: 'STRING' } },
        photoPlaceholders: {
            type: 'ARRAY',
            items: {
                type: 'OBJECT',
                properties: { title: { type: 'STRING' }, description: { type: 'STRING' } },
                required: ['title', 'description'],
            },
        },
    },
    required: ['title', 'subtitle', 'descriptionParagraphs', 'highlights', 'photoPlaceholders'],
};

const normalizeShowcaseOffer = (generatedValue: unknown): Omit<ShowcaseOffer, 'generatedAt'> => {
    const generated = generatedValue && typeof generatedValue === 'object' ? generatedValue as Record<string, unknown> : {};
    const photoPlaceholders = Array.isArray(generated.photoPlaceholders)
        ? generated.photoPlaceholders.slice(0, 10).map((item) => {
            const photo = item && typeof item === 'object' ? item as Record<string, unknown> : {};
            return { id: crypto.randomUUID(), title: String(photo.title || 'Ujęcie nieruchomości').trim(), description: String(photo.description || 'Profesjonalne, jasne i szerokie ujęcie wnętrza.').trim() };
        })
        : [];
    return {
        title: String(generated.title || 'Nowa oferta Domiz Homes').trim(),
        subtitle: String(generated.subtitle || '').trim(),
        description: Array.isArray(generated.descriptionParagraphs)
            ? generated.descriptionParagraphs.map(String).map((item) => item.trim()).filter(Boolean).slice(0, 8).join('\n\n')
            : String(generated.description || '').trim(),
        highlights: Array.isArray(generated.highlights) ? generated.highlights.map(String).map((item) => item.trim()).filter(Boolean).slice(0, 8) : [],
        photoPlaceholders,
    };
};

const normalizeGeneratedAudit = (generatedValue: unknown, language: AuditLanguage): LocalizedAudit => {
    const generated = generatedValue && typeof generatedValue === 'object' ? generatedValue as Record<string, unknown> : {};
    const scores = generated.scores && typeof generated.scores === 'object' ? generated.scores as Record<string, unknown> : {};
    const clampScore = (value: unknown) => Math.max(0, Math.min(100, Number(value) || 0));
    const toList = (value: unknown, limit: number) => Array.isArray(value) ? value.map(String).slice(0, limit) : [];
    const auditData: AuditDraft = {
        photos: String(generated?.photos || '').trim(), description: String(generated?.description || '').trim(), price: String(generated?.price || '').trim(), targetAudience: String(generated?.targetAudience || '').trim(), actionPlan: String(generated?.actionPlan || '').trim(), overallScore: clampScore(generated?.overallScore),
        scores: { photos: clampScore(scores.photos), description: clampScore(scores.description), price: clampScore(scores.price), positioning: clampScore(scores.positioning), completeness: clampScore(scores.completeness), conversion: clampScore(scores.conversion) },
        strengths: toList(generated?.strengths, 5), risks: toList(generated?.risks, 5), quickWins: toList(generated?.quickWins, 5), contactAngle: String(generated?.contactAngle || '').trim(), recommendedHeadline: String(generated?.recommendedHeadline || '').trim(), auditVerdict: String(generated?.auditVerdict || '').trim(), dataQualityNote: String(generated?.dataQualityNote || '').trim(), buyerPersona: String(generated?.buyerPersona || '').trim(), buyerObjections: toList(generated?.buyerObjections, 6), missingInformation: toList(generated?.missingInformation, 8), photoPlan: toList(generated?.photoPlan, 8), marketingChannels: toList(generated?.marketingChannels, 8), pricingRecommendation: String(generated?.pricingRecommendation || '').trim(), differentiationStrategy: String(generated?.differentiationStrategy || '').trim(), contactQuestions: toList(generated?.contactQuestions, 8), sevenDayPlan: toList(generated?.sevenDayPlan, 7), recommendedNextStep: String(generated?.recommendedNextStep || '').trim(), estimatedSalePrice: String(generated?.estimatedSalePrice || '').trim(), estimatedSalePriceRange: String(generated?.estimatedSalePriceRange || '').trim(), estimatedTimeToSell: String(generated?.estimatedTimeToSell || '').trim(), estimateConfidence: String(generated?.estimateConfidence || '').trim(), estimateRationale: String(generated?.estimateRationale || '').trim(), estimateAssumptions: toList(generated?.estimateAssumptions, 6),
    };
    const fallbackLabels = language === 'pl'
        ? ['Zdjęcia i ekspozycja', 'Opis ogłoszenia', 'Cena i pozycjonowanie', 'Grupa docelowa', 'Plan działania']
        : ['Photos and presentation', 'Listing description', 'Price and positioning', 'Target audience', 'Action plan'];
    const auditSummary = String(generated?.summary || '').trim() || [auditData.photos, auditData.description, auditData.price, auditData.targetAudience, auditData.actionPlan].map((value, index) => `${fallbackLabels[index]}: ${value}`).join('\n\n');
    return { auditData, auditSummary };
};
const ACQUISITION_STAGES: Array<{ id: AcquisitionStage; label: string; color: string; background: string }> = [
    { id: 'new', label: 'Nowe ogłoszenie', color: '#0e7490', background: '#ecfeff' },
    { id: 'audit', label: 'Audyt ogłoszenia', color: '#7c3aed', background: '#f5f3ff' },
    { id: 'ready_to_call', label: 'Gotowe do kontaktu', color: '#b45309', background: '#fffbeb' },
    { id: 'contacted', label: 'Rozmowa z właścicielem', color: '#1d4ed8', background: '#eff6ff' },
    { id: 'consent_draft', label: 'Zgoda — szkic oferty', color: '#0f766e', background: '#f0fdfa' },
    { id: 'meeting', label: 'Spotkanie / prezentacja planu', color: '#c2410c', background: '#fff7ed' },
    { id: 'proposal', label: 'Oferta współpracy', color: '#9a3412', background: '#fff7ed' },
    { id: 'acquired', label: 'Umowa podpisana', color: '#047857', background: '#ecfdf5' },
    { id: 'nurture', label: 'Wrócić później', color: '#475569', background: '#f1f5f9' },
    { id: 'rejected', label: 'Nieaktualne / przegrane', color: '#b91c1c', background: '#fef2f2' },
];

export const AdminDashboard = () => {
    const { properties, loading } = useProperties(true);
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        document.title = 'Panel administratora | Domiz Homes';
    }, []);

    const [deleting, setDeleting] = useState<number | null>(null);
    const [updatingPropertyStatus, setUpdatingPropertyStatus] = useState<number | null>(null);
    const [auditingPropertyId, setAuditingPropertyId] = useState<number | null>(null);
    const [improvingDescriptionId, setImprovingDescriptionId] = useState<number | null>(null);
    const [descriptionImproveTarget, setDescriptionImproveTarget] = useState<{
        property: Property;
        description: string;
        descriptionEn: string;
        saving?: boolean;
    } | null>(null);
    const [pwaInstallPrompt, setPwaInstallPrompt] = useState<PwaInstallPromptEvent | null>(null);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem(READ_NOTIFICATIONS_KEY) || '[]') as string[]; } catch { return []; }
    });
    const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(() => localStorage.getItem(PUSH_NOTIFICATIONS_KEY) === 'enabled');
    const [notificationCaretaker, setNotificationCaretaker] = useState<(typeof PROPERTY_CARETAKERS)[number]>(() => {
        const saved = localStorage.getItem(NOTIFICATION_CARETAKER_KEY);
        return PROPERTY_CARETAKERS.includes(saved as (typeof PROPERTY_CARETAKERS)[number]) ? saved as (typeof PROPERTY_CARETAKERS)[number] : 'Tomasz Gnat';
    });
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const inquiriesLoading = false;
    const [activeTab, setActiveTab] = useState<'dashboard' | 'offers' | 'leads' | 'acquisition' | 'estates' | 'presentation' | 'proposals' | 'agreements' | 'clientAccounts' | 'videos' | 'settings'>('acquisition');
    const [videoStudioPropertyId, setVideoStudioPropertyId] = useState<number | null>(null);
    const [leadView, setLeadView] = useState<'board' | 'list'>('board');
    const [leadFilter, setLeadFilter] = useState<'all' | PipelineStage>('all');
    const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);
    const [deletingLeadId, setDeletingLeadId] = useState<string | null>(null);
    const [savingLeadId, setSavingLeadId] = useState<string | null>(null);
    const [leadDrafts, setLeadDrafts] = useState<Record<string, LeadDraft>>({});
    const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
    const [newLead, setNewLead] = useState<NewLeadDraft>(EMPTY_NEW_LEAD);
    const [creatingLead, setCreatingLead] = useState(false);
    const [propertyLeads, setPropertyLeads] = useState<PropertyLead[]>([]);
    const propertyLeadsRef = useRef(propertyLeads);
    const consentDraftInFlight = useRef(new Set<string>());
    propertyLeadsRef.current = propertyLeads;
    const [ownerConsentsById, setOwnerConsentsById] = useState<Record<string, OwnerConsentLike>>({});
    const [propertyLeadsLoading, setPropertyLeadsLoading] = useState(true);
    const [acquisitionFilter, setAcquisitionFilter] = useState<'all' | AcquisitionStage>('all');
    const [acquisitionView, setAcquisitionView] = useState<'list' | 'board'>('list');
    const [acquisitionSearch, setAcquisitionSearch] = useState('');
    const [acquisitionSourceFilter, setAcquisitionSourceFilter] = useState('all');
    const [callTodayOnly, setCallTodayOnly] = useState(false);
    const [moreTabsOpen, setMoreTabsOpen] = useState(false);
    const [showOldImports, setShowOldImports] = useState(false);
    const [ownerLeadCount, setOwnerLeadCount] = useState(0);
    const [acquisitionAssigneeFilter, setAcquisitionAssigneeFilter] = useState<'all' | 'unassigned' | (typeof PROPERTY_CARETAKERS)[number]>('all');
    const [privateOnly, setPrivateOnly] = useState(false);
    const [attentionOnly, setAttentionOnly] = useState(false);
    const [acquisitionSort, setAcquisitionSort] = useState<'newest' | 'deadline' | 'price_desc' | 'price_asc'>('newest');
    const [incompleteOnly, setIncompleteOnly] = useState(false);
    const [savingAssigneeId, setSavingAssigneeId] = useState<string | null>(null);
    const [isPropertyLeadOpen, setIsPropertyLeadOpen] = useState(false);
    const [newPropertyLead, setNewPropertyLead] = useState<NewPropertyLeadDraft>(EMPTY_PROPERTY_LEAD);
    const [creatingPropertyLead, setCreatingPropertyLead] = useState(false);
    const [otodomPaste, setOtodomPaste] = useState('');
    const [isSourceImportOpen, setIsSourceImportOpen] = useState(false);
    const [sourceUrl, setSourceUrl] = useState('');
    const [sourceText, setSourceText] = useState('');
    const [noteTarget, setNoteTarget] = useState<PropertyLead | null>(null);
    const [newAcquisitionNote, setNewAcquisitionNote] = useState('');
    const [savingAcquisitionNote, setSavingAcquisitionNote] = useState(false);
    const [auditTarget, setAuditTarget] = useState<PropertyLead | null>(null);
    const [auditDraft, setAuditDraft] = useState<AuditDraft>({ photos: '', description: '', price: '', targetAudience: '', actionPlan: '' });
    const [savingAudit, setSavingAudit] = useState(false);
    const [generatingAuditId, setGeneratingAuditId] = useState<string | null>(null);
    const [generatingShowcaseId, setGeneratingShowcaseId] = useState<string | null>(null);
    const [showcasePreviewLeadId, setShowcasePreviewLeadId] = useState<string | null>(null);
    const [presentationMode, setPresentationMode] = useState<'agency' | 'strategy' | 'audit'>('agency');
    const [presentationLeadId, setPresentationLeadId] = useState('');
    const [taskTarget, setTaskTarget] = useState<PropertyLead | null>(null);
    const [taskDraft, setTaskDraft] = useState({ title: '', dueDate: '', owner: '' });
    const [savingTask, setSavingTask] = useState(false);
    const [activityTarget, setActivityTarget] = useState<PropertyLead | null>(null);
    const [activityDraft, setActivityDraft] = useState<{ type: AcquisitionActivity['type']; summary: string }>({ type: 'call', summary: '' });
    const [savingActivity, setSavingActivity] = useState(false);
    const [convertingPropertyLead, setConvertingPropertyLead] = useState<string | null>(null);
    const [conversionTarget, setConversionTarget] = useState<PropertyLead | null>(null);
    const [conversionOptions, setConversionOptions] = useState<{ priceMode: 'audit' | 'current'; publishNow: boolean; propertyMode: 'new' | 'update' }>({ priceMode: 'audit', publishNow: false, propertyMode: 'new' });
    const [uploadingAttachmentId, setUploadingAttachmentId] = useState<string | null>(null);
    const [proposalTarget, setProposalTarget] = useState<PropertyLead | null>(null);
    const [proposalDraft, setProposalDraft] = useState<ProposalDraft>({ packageVariant: 'start', selectedServices: defaultProposalServices('start'), scope: buildProposalScope('start', defaultProposalServices('start')), commission: '', agreementType: 'Umowa na wyłączność', decisionDate: '' });
    const [proposalInquiryId, setProposalInquiryId] = useState('');
    const [proposalLoadNotice, setProposalLoadNotice] = useState('');
    const [savingProposal, setSavingProposal] = useState(false);
    const [isProposalWizardOpen, setIsProposalWizardOpen] = useState(false);
    const [proposalWizardStep, setProposalWizardStep] = useState(1);
    const [proposalRequestedListingId, setProposalRequestedListingId] = useState('');
    const [proposalDecisionTarget, setProposalDecisionTarget] = useState<PropertyLead | null>(null);
    const [proposalDecisionDraft, setProposalDecisionDraft] = useState<Omit<ProposalDecision, 'decidedAt'>>({ outcome: 'accepted', note: '' });
    const [savingProposalDecision, setSavingProposalDecision] = useState(false);
    const [documentTarget, setDocumentTarget] = useState<PropertyLead | null>(null);
    const [documentKind, setDocumentKind] = useState<CooperationDocumentKind>('proposal');
    const [documentContent, setDocumentContent] = useState('');
    const [savingDocument, setSavingDocument] = useState(false);
    const [sendingToGamma, setSendingToGamma] = useState(false);
    const [gammaNotice, setGammaNotice] = useState('');
    const [sendingToGoogleDocs, setSendingToGoogleDocs] = useState(false);
    const [googleDocsNotice, setGoogleDocsNotice] = useState('');
    const [callOutcomeTarget, setCallOutcomeTarget] = useState<PropertyLead | null>(null);
    const [callOutcomeDraft, setCallOutcomeDraft] = useState<{ outcome: CallOutcome; note: string; followUpDate: string }>({ outcome: 'no_answer', note: '', followUpDate: '' });
    const [savingCallOutcome, setSavingCallOutcome] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('newProposal') !== '1') return;
        const listingId = params.get('listingId') || '';
        setProposalTarget(null);
        setProposalDraft({ packageVariant: 'start', selectedServices: [], scope: '', commission: '', agreementType: 'Umowa na wyłączność', decisionDate: '' });
        setProposalWizardStep(1);
        setProposalRequestedListingId(listingId);
        setIsProposalWizardOpen(true);
        window.history.replaceState({}, '', '/admin');
    }, []);

    useEffect(() => {
        if (!proposalRequestedListingId || !propertyLeads.length) return;
        const listing = propertyLeads.find((item) => item.id === proposalRequestedListingId);
        if (!listing) return;
        selectWizardProposalTarget(listing);
        setProposalRequestedListingId('');
    }, [proposalRequestedListingId, propertyLeads]);

    const crmNotifications = useMemo<CrmNotification[]>(() => {
        const today = new Date().toISOString().slice(0, 10);
        const tomorrowDate = new Date();
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);
        const tomorrow = tomorrowDate.toISOString().slice(0, 10);
        const fiveDaysAgo = Date.now() - 5 * 24 * 60 * 60 * 1000;
        const items: CrmNotification[] = [];

        propertyLeads.forEach((lead) => {
            (lead.tasks || []).filter((task) => task.status === 'open' && task.dueDate <= today).forEach((task) => {
                const overdue = task.dueDate < today;
                items.push({ id: `task:${lead.id}:${task.id}:${task.dueDate}`, type: overdue ? 'overdue' : 'today', title: overdue ? 'Zaległe zadanie' : 'Zadanie na dziś', body: `${task.title} — ${lead.title || 'potencjalna oferta'}`, leadId: lead.id, assignee: task.owner || lead.assignee, date: task.dueDate, priority: overdue ? 100 : 90 });
            });

            if (lead.proposal?.decisionDate && !lead.proposalDecision && lead.proposal.decisionDate <= tomorrow) {
                const overdue = lead.proposal.decisionDate < today;
                items.push({ id: `decision:${lead.id}:${lead.proposal.decisionDate}`, type: 'decision', title: overdue ? 'Termin decyzji minął' : lead.proposal.decisionDate === today ? 'Decyzja właściciela dzisiaj' : 'Decyzja właściciela jutro', body: lead.title || 'Potencjalna oferta', leadId: lead.id, assignee: lead.assignee, date: lead.proposal.decisionDate, priority: overdue ? 95 : 80 });
            }

            if (hasFinishedAudit(lead) && (lead.stage === 'new' || lead.stage === 'audit' || lead.stage === 'ready_to_call')) {
                items.push({ id: `audit:${lead.id}:${lead.auditedAt || lead.updatedAt || 'ready'}`, type: 'audit', title: 'Audyt jest gotowy', body: `${lead.title || 'Oferta'} — można przygotować kontakt z właścicielem`, leadId: lead.id, assignee: lead.assignee, priority: 60 });
            }

            const referenceDate = lead.lastContactAt || lead.updatedAt || lead.createdAt;
            if (lead.assignee && referenceDate && !['acquired', 'rejected'].includes(lead.stage || 'new') && new Date(referenceDate).getTime() < fiveDaysAgo) {
                items.push({ id: `stale:${lead.id}:${referenceDate.slice(0, 10)}`, type: 'stale', title: 'Brak aktywności od 5 dni', body: lead.title || 'Potencjalna oferta', leadId: lead.id, assignee: lead.assignee, priority: 50 });
            }
        });

        return items.sort((a, b) => b.priority - a.priority || (a.date || '').localeCompare(b.date || ''));
    }, [propertyLeads]);
    const unreadNotifications = crmNotifications.filter((notification) => !readNotificationIds.includes(notification.id));
    const callQueue = useMemo(() => buildCallQueue(propertyLeads), [propertyLeads]);
    const oldImportCount = properties.filter((property) => isOldUnpublishedImport(property)).length;
    const visibleOffers = showOldImports ? properties : properties.filter((property) => !isOldUnpublishedImport(property));
    const callQueueIds = useMemo(() => new Set(callQueue.map((row) => row.lead.id)), [callQueue]);
    const acquisitionSourceOptions = useMemo(() => {
        const present = new Set(propertyLeads.map((item) => listingSourceKey(item)).filter(Boolean));
        return ['Otodom', 'OLX', 'Facebook', ...EXTRA_LISTING_SOURCES].filter((source) => present.has(source));
    }, [propertyLeads]);

    const filteredPropertyLeads = useMemo(() => {
        const needle = acquisitionSearch.trim().toLocaleLowerCase('pl-PL');
        const today = new Date().toISOString().slice(0, 10);
        const filtered = propertyLeads.filter((item) => {
            const matchesStage = acquisitionFilter === 'all' || (item.stage || 'new') === acquisitionFilter;
            const matchesText = !needle || [item.title, item.location, item.price, item.assignee, item.ownerName, item.sourceDetails?.advertiserType].filter(Boolean).join(' ').toLocaleLowerCase('pl-PL').includes(needle);
            const itemSource = listingSourceKey(item);
            const matchesSource = acquisitionSourceFilter === 'all' || itemSource === acquisitionSourceFilter;
            const matchesAssignee = acquisitionAssigneeFilter === 'all' || (acquisitionAssigneeFilter === 'unassigned' ? !item.assignee : item.assignee === acquisitionAssigneeFilter);
            const matchesPrivate = !privateOnly || isPrivateAdvertiser(item.sourceDetails?.advertiserType);
            const matchesCallToday = !callTodayOnly || callQueueIds.has(item.id);
            const requiresAttention = (item.tasks || []).some((task) => task.status === 'open' && task.dueDate < today) || Boolean(item.proposal?.decisionDate && !item.proposalDecision && item.proposal.decisionDate < today);
            const incomplete = !item.ownerPhone || !item.propertyDraft?.image && !item.propertyDraft?.images?.length || !item.price || ((item.stage === 'audit' || item.stage === 'ready_to_call') && !item.auditSummary);
            return matchesStage && matchesText && matchesSource && matchesAssignee && matchesPrivate && matchesCallToday && (!attentionOnly || requiresAttention) && (!incompleteOnly || incomplete);
        });
        const priceValue = (value?: string) => Number((value || '').replace(/[^\d]/g, '')) || 0;
        const nextDeadline = (item: PropertyLead) => [...(item.tasks || []).filter((task) => task.status === 'open').map((task) => task.dueDate), ...(item.proposal?.decisionDate && !item.proposalDecision ? [item.proposal.decisionDate] : [])].sort()[0] || '9999-12-31';
        return filtered.slice().sort((a, b) => acquisitionSort === 'deadline' ? nextDeadline(a).localeCompare(nextDeadline(b)) : acquisitionSort === 'price_desc' ? priceValue(b.price) - priceValue(a.price) : acquisitionSort === 'price_asc' ? priceValue(a.price) - priceValue(b.price) : (b.createdAt || '').localeCompare(a.createdAt || ''));
    }, [propertyLeads, acquisitionFilter, acquisitionSearch, acquisitionSourceFilter, acquisitionAssigneeFilter, privateOnly, attentionOnly, incompleteOnly, acquisitionSort, callTodayOnly, callQueueIds]);
    const hasActiveAcquisitionFilters = acquisitionFilter !== 'all' || Boolean(acquisitionSearch.trim()) || acquisitionSourceFilter !== 'all' || acquisitionAssigneeFilter !== 'all' || privateOnly || attentionOnly || incompleteOnly || callTodayOnly;
    const clearAcquisitionFilters = () => {
        setAcquisitionFilter('all');
        setAcquisitionSearch('');
        setAcquisitionSourceFilter('all');
        setAcquisitionAssigneeFilter('all');
        setPrivateOnly(false);
        setAttentionOnly(false);
        setIncompleteOnly(false);
        setCallTodayOnly(false);
    };
    const [deletingPropertyLead, setDeletingPropertyLead] = useState<string | null>(null);
    const [viewingPropertyLead, setViewingPropertyLead] = useState<PropertyLead | null>(null);
    const [editingPropertyLeadId, setEditingPropertyLeadId] = useState<string | null>(null);
    const [uploadingPropertyLeadImages, setUploadingPropertyLeadImages] = useState(false);
    const [propertyLeadImageUploadProgress, setPropertyLeadImageUploadProgress] = useState(0);
    const [propertyLeadImageUploadNotice, setPropertyLeadImageUploadNotice] = useState('');

    const handleDelete = async (id: number) => {
        if (!window.confirm("Czy na pewno chcesz usunąć tę ofertę? Operacji nie można cofnąć.")) return;
        setDeleting(id);
        try {
            await deleteDoc(doc(db, "properties", id.toString()));
            // Proste odświeżenie strony po usunięciu
            window.location.reload();
        } catch (error: any) {
            console.error(error);
            alert("Błąd usuwania: " + error.message);
        } finally {
            setDeleting(null);
        }
    };

    const consentForProperty = (propertyId: number) => {
        const property = properties.find((item) => item.id === propertyId) as (typeof properties[number] & { ownerConsentId?: string; acquisitionListingId?: string; sourceAcquisitionId?: string }) | undefined;
        if (!property) return null;
        if (property.ownerConsentId && ownerConsentsById[property.ownerConsentId]) return ownerConsentsById[property.ownerConsentId];
        const listingId = property.acquisitionListingId || property.sourceAcquisitionId;
        const lead = propertyLeads.find((item) => item.id === listingId || item.draftPropertyId === propertyId || item.activePropertyId === propertyId);
        return lead ? consentForLead(lead, ownerConsentsById) : Object.values(ownerConsentsById).find((item) => item.acquisitionListingId === listingId) || null;
    };

    const togglePropertyPublication = async (propertyId: number, isPublished: boolean) => {
        if (!isPublished) {
            const reason = publishBlockReason(consentForProperty(propertyId));
            if (reason) {
                alert(reason);
                return;
            }
        }
        setUpdatingPropertyStatus(propertyId);
        try {
            await updateDoc(doc(db, 'properties', propertyId.toString()), {
                published: !isPublished,
                updatedAt: new Date().toISOString(),
            });
        } catch (error: any) {
            console.error('Błąd zmiany statusu oferty:', error);
            alert(`Nie udało się zmienić statusu oferty: ${error.message}`);
        } finally {
            setUpdatingPropertyStatus(null);
        }
    };

    const loadPropertyLeads = async () => {
        setPropertyLeadsLoading(true);
        try {
            const snapshot = await getDocs(query(collection(db, 'acquisitionListings'), orderBy('createdAt', 'desc')));
            const items = snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<PropertyLead, 'id'>) }));
            setPropertyLeads(items);
        } catch (error) {
            console.error('Błąd pobierania ogłoszeń:', error);
        } finally {
            setPropertyLeadsLoading(false);
        }
    };

    useEffect(() => {
        void loadPropertyLeads();
    }, []);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'ownerConsents'), (snapshot) => {
            const next: Record<string, OwnerConsentLike> = {};
            snapshot.forEach((item) => {
                next[item.id] = { id: item.id, ...(item.data() as Omit<OwnerConsentLike, 'id'>) };
            });
            setOwnerConsentsById(next);
        }, (error) => {
            console.error('Błąd odczytu zgód właścicieli:', error);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'ownerLeads'), (snapshot) => {
            setOwnerLeadCount(snapshot.size);
        }, () => setOwnerLeadCount(0));
        return unsubscribe;
    }, []);

    useEffect(() => {
        const unsubscribe = onSnapshot(query(collection(db, 'inquiries'), orderBy('createdAt', 'desc')), (snapshot) => {
            setInquiries(snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<Inquiry, 'id'>) })));
        }, (error) => console.error('Błąd pobierania leadów:', error));
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (propertyLeadsLoading) return;
        const url = new URL(window.location.href);
        const leadId = url.searchParams.get('pozysk');
        if (!leadId) return;
        const lead = propertyLeads.find((item) => item.id === leadId);
        if (lead) {
            setActiveTab('acquisition');
            setViewingPropertyLead(lead);
        }
        url.searchParams.delete('pozysk');
        window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }, [propertyLeads, propertyLeadsLoading]);

    useEffect(() => {
        const captureInstallPrompt = (event: Event) => {
            event.preventDefault();
            setPwaInstallPrompt(event as PwaInstallPromptEvent);
        };
        window.addEventListener('beforeinstallprompt', captureInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', captureInstallPrompt);
    }, []);

    const installPwa = async () => {
        if (!pwaInstallPrompt) return;
        await pwaInstallPrompt.prompt();
        await pwaInstallPrompt.userChoice;
        setPwaInstallPrompt(null);
    };

    const setLeadStatus = async (leadId: string, status: PipelineStage) => {
        setUpdatingLeadId(leadId);
        try {
            await updateDoc(doc(db, 'inquiries', leadId), {
                leadStatus: status,
                updatedAt: new Date().toISOString(),
            });
            setInquiries((prev) =>
                prev.map((lead) =>
                    lead.id === leadId ? { ...lead, leadStatus: status } : lead
                )
            );
        } catch (error) {
            console.error('Błąd aktualizacji statusu leada:', error);
            alert('Nie udało się zaktualizować statusu leada.');
        } finally {
            setUpdatingLeadId(null);
        }
    };

    const createLead = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!newLead.name.trim()) {
            alert('Podaj imię i nazwisko lub nazwę klienta.');
            return;
        }
        if (!newLead.email.trim() && !newLead.phone.trim()) {
            alert('Podaj przynajmniej telefon lub e-mail.');
            return;
        }

        setCreatingLead(true);
        const createdAt = new Date().toISOString();
        const leadData = {
            type: 'manual',
            name: newLead.name.trim(),
            email: newLead.email.trim(),
            phone: newLead.phone.trim(),
            source: newLead.source.trim() || 'CRM — ręcznie',
            leadStatus: newLead.leadStatus,
            owner: newLead.owner.trim(),
            followUpDate: newLead.followUpDate,
            message: newLead.message.trim(),
            adminNote: newLead.message.trim(),
            createdAt,
            updatedAt: createdAt,
            createdBy: user?.email || '',
        };
        try {
            const reference = await addDoc(collection(db, 'inquiries'), leadData);
            const savedLead: Inquiry = { id: reference.id, ...leadData };
            setInquiries((previous) => [savedLead, ...previous]);
            setLeadDrafts((previous) => ({ ...previous, [reference.id]: { owner: leadData.owner, followUpDate: leadData.followUpDate, adminNote: leadData.adminNote } }));
            setNewLead(EMPTY_NEW_LEAD);
            setLeadFilter('all');
            setLeadView('board');
            setActiveTab('leads');
            setIsNewLeadOpen(false);
        } catch (error) {
            console.error('Błąd tworzenia leada:', error);
            alert('Nie udało się dodać leada. Spróbuj ponownie.');
        } finally {
            setCreatingLead(false);
        }
    };

    const openPropertyLeadEditor = (item: PropertyLead) => {
        const draft = item.propertyDraft;
        const details = item.sourceDetails || {};
        setNewPropertyLead({
            url: item.url || '', sourceText: item.sourceText || '', title: item.title || draft?.title || '', location: item.location || draft?.location || '', price: item.price || (draft?.price ? `${draft.price} zł` : ''), note: item.note || draft?.description || '', ownerName: item.ownerName || '', ownerPhone: item.ownerPhone || '', assignee: item.assignee || '', areaM2: item.areaM2?.toString() || draft?.sqft?.toString() || '', rooms: item.rooms?.toString() || draft?.beds?.toString() || '', baths: draft?.baths?.toString() || '', type: draft?.type || 'mieszkanie', status: draft?.status || 'sprzedaz', features: draft?.features?.join(', ') || '', pricePerM2: details.pricePerM2 || '', heating: details.heating || '', floor: details.floor || '', rent: details.rent || '', finishCondition: details.finishCondition || '', market: details.market || '', ownership: details.ownership || '', availableFrom: details.availableFrom || '', advertiserType: details.advertiserType || '', buildingElevator: details.buildingElevator || '', buildingType: details.buildingType || '', windows: details.windows || '', image: draft?.image || '', images: draft?.images || [],
        });
        setPropertyLeadImageUploadNotice('');
        setPropertyLeadImageUploadProgress(0);
        setEditingPropertyLeadId(item.id);
        setIsPropertyLeadOpen(true);
    };

    const handlePropertyLeadImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const input = event.currentTarget;
        const files = Array.from(event.target.files || []);
        if (!files.length) return;
        setUploadingPropertyLeadImages(true);
        setPropertyLeadImageUploadProgress(0);
        setPropertyLeadImageUploadNotice('');
        try {
            const path = `acquisitionListings/${editingPropertyLeadId || 'drafts'}`;
            const progressByFile = files.map(() => 0);
            const results = await Promise.allSettled(files.map((file, index) => uploadImage(file, path, {
                onProgress: (progress) => {
                    progressByFile[index] = progress;
                    setPropertyLeadImageUploadProgress(Math.round(progressByFile.reduce((sum, value) => sum + value, 0) / files.length));
                },
            })));
            const urls = results.flatMap((result) => result.status === 'fulfilled' ? [result.value] : []);
            const errors = results.flatMap((result) => result.status === 'rejected' ? [result.reason] : []);

            if (!urls.length) throw errors[0] || new Error('Nie udało się wgrać żadnego zdjęcia.');

            const mergedImages = Array.from(new Set([...newPropertyLead.images, ...urls]));
            const mainImage = newPropertyLead.image || mergedImages[0] || '';
            setNewPropertyLead((draft) => ({ ...draft, image: draft.image || urls[0], images: Array.from(new Set([...draft.images, ...urls])) }));

            if (editingPropertyLeadId) {
                const savedAt = new Date().toISOString();
                await updateDoc(doc(db, 'acquisitionListings', editingPropertyLeadId), {
                    'propertyDraft.image': mainImage,
                    'propertyDraft.images': mergedImages,
                    updatedAt: savedAt,
                });
                setPropertyLeads((previous) => previous.map((item) => item.id === editingPropertyLeadId ? {
                    ...item,
                    updatedAt: savedAt,
                    propertyDraft: item.propertyDraft ? { ...item.propertyDraft, image: mainImage, images: mergedImages } : item.propertyDraft,
                } : item));
                setViewingPropertyLead((item) => item?.id === editingPropertyLeadId && item.propertyDraft ? {
                    ...item,
                    updatedAt: savedAt,
                    propertyDraft: { ...item.propertyDraft, image: mainImage, images: mergedImages },
                } : item);
            }

            setPropertyLeadImageUploadNotice(errors.length
                ? `Zapisano ${urls.length} z ${files.length} zdjęć. Pozostałe pliki wymagają ponownej próby.`
                : `Zapisano ${urls.length} ${urls.length === 1 ? 'zdjęcie' : 'zdjęcia'}.`);
        } catch (error: any) {
            console.error('Błąd wgrywania zdjęć:', error);
            const message = error?.message || 'Nie udało się wgrać zdjęć. Spróbuj ponownie.';
            setPropertyLeadImageUploadNotice(message);
        } finally {
            setUploadingPropertyLeadImages(false);
            setPropertyLeadImageUploadProgress(0);
            input.value = '';
        }
    };

    const removePropertyLeadImage = (url: string) => {
        setNewPropertyLead((draft) => {
            const images = draft.images.filter((image) => image !== url);
            return { ...draft, images, image: draft.image === url ? (images[0] || '') : draft.image };
        });
    };

    const createPropertyLead = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (uploadingPropertyLeadImages) {
            setPropertyLeadImageUploadNotice('Poczekaj, aż wszystkie zdjęcia zostaną wgrane.');
            return;
        }
        let url: URL;
        try {
            url = new URL(newPropertyLead.url.trim());
        } catch {
            alert('Wklej poprawny link do ogłoszenia.');
            return;
        }
        const listingSource = getListingSource(url);
        if (!listingSource) {
            alert('Wklej link z Otodom, OLX lub Facebooka.');
            return;
        }
        setCreatingPropertyLead(true);
        const savedAt = new Date().toISOString();
        const numericPrice = Number(newPropertyLead.price.replace(/[^\d]/g, '')) || 0;
        const featureList = newPropertyLead.features.split(',').map((value) => value.trim()).filter(Boolean);
        const propertyDraft = {
            title: newPropertyLead.title.trim(),
            price: numericPrice,
            location: newPropertyLead.location.trim(),
            beds: Number(newPropertyLead.rooms) || 0,
            baths: Number(newPropertyLead.baths) || 0,
            sqft: Number(newPropertyLead.areaM2.replace(',', '.')) || 0,
            type: newPropertyLead.type,
            status: newPropertyLead.status,
            description: newPropertyLead.note.trim(),
            features: featureList,
            image: newPropertyLead.image || newPropertyLead.images[0] || '',
            images: newPropertyLead.images,
            featured: false,
            agent: { name: 'Tomasz Gnat', phone: '+48 517 303 400', email: 'tomasz.gnat@domiz.pl', image: '' },
        };
        const sourceDetails = {
            pricePerM2: newPropertyLead.pricePerM2.trim(), heating: newPropertyLead.heating.trim(), floor: newPropertyLead.floor.trim(), rent: newPropertyLead.rent.trim(), finishCondition: newPropertyLead.finishCondition.trim(), market: newPropertyLead.market.trim(), ownership: newPropertyLead.ownership.trim(), availableFrom: newPropertyLead.availableFrom.trim(), advertiserType: newPropertyLead.advertiserType.trim(), buildingElevator: newPropertyLead.buildingElevator.trim(), buildingType: newPropertyLead.buildingType.trim(), windows: newPropertyLead.windows.trim(),
        };
        const duplicate = propertyLeads.find((item) => item.url === url.toString() && item.id !== editingPropertyLeadId);
        if (duplicate) {
            alert('To ogłoszenie jest już w bazie. Otwieram istniejący pozysk.');
            setViewingPropertyLead(duplicate);
            setIsPropertyLeadOpen(false);
            setCreatingPropertyLead(false);
            return;
        }
        const data = { url: url.toString(), sourceText: newPropertyLead.sourceText.trim(), title: propertyDraft.title, location: propertyDraft.location, price: newPropertyLead.price.trim(), note: newPropertyLead.note.trim(), source: listingSource, ownerName: newPropertyLead.ownerName.trim(), ownerPhone: newPropertyLead.ownerPhone.trim(), assignee: newPropertyLead.assignee.trim(), areaM2: propertyDraft.sqft, rooms: propertyDraft.beds, propertyDraft, sourceDetails };
        try {
            if (editingPropertyLeadId) {
                await updateDoc(doc(db, 'acquisitionListings', editingPropertyLeadId), { ...data, updatedAt: savedAt });
                setPropertyLeads((previous) => previous.map((item) => item.id === editingPropertyLeadId ? { ...item, ...data, updatedAt: savedAt } : item));
                setViewingPropertyLead((item) => item?.id === editingPropertyLeadId ? { ...item, ...data } : item);
            } else {
                const initialHistory: AcquisitionStageHistory[] = [{ id: crypto.randomUUID(), stage: 'new', label: 'Nowe ogłoszenie', note: `Pozysk dodany z ${listingSource}.`, createdAt: savedAt, author: user?.email || 'Domiz Homes' }];
                const reference = await addDoc(collection(db, 'acquisitionListings'), { ...data, stage: 'new' as AcquisitionStage, stageHistory: initialHistory, createdAt: savedAt });
                setPropertyLeads((previous) => [{ id: reference.id, ...data, stage: 'new' as AcquisitionStage, stageHistory: initialHistory, createdAt: savedAt }, ...previous]);
                if (AI_AUDIT_ENABLED) void generateAiAudit(reference.id);
            }
            setNewPropertyLead(EMPTY_PROPERTY_LEAD);
            setEditingPropertyLeadId(null);
            setIsPropertyLeadOpen(false);
        } catch (error) {
            console.error('Błąd dodawania ogłoszenia:', error);
            alert('Nie udało się dodać ogłoszenia. Spróbuj ponownie.');
        } finally {
            setCreatingPropertyLead(false);
        }
    };

    const importOtodomPaste = (rawText = otodomPaste, rawUrl = '') => {
        const text = rawText.trim();
        if (!text) return;
        const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
        const find = (pattern: RegExp) => text.match(pattern)?.[1]?.trim() || '';
        const valueAfterLabel = (label: string) => find(new RegExp(`${label}\\s*:\\s*([^\\n]+)`, 'i'));
        const priceDigits = find(/(?:Cena\s*)?([\d\s ]+)\s*zł/i).replace(/[^\d]/g, '');
        const area = find(/Powierzchnia\s*:?\s*([\d.,]+)\s*m²/i).replace(',', '.');
        const rooms = find(/Liczba pokoi\s*:?\s*(\d+)/i);
        const pricePerM2 = find(/(\d[\d\s.,]*\s*zł\/m²)/i);
        const heating = valueAfterLabel('Ogrzewanie');
        const floor = valueAfterLabel('Piętro');
        const rent = valueAfterLabel('Czynsz');
        const finishCondition = valueAfterLabel('Stan wykończenia');
        const market = valueAfterLabel('Rynek');
        const ownership = valueAfterLabel('Forma własności');
        const availableFrom = valueAfterLabel('Dostępne od');
        const advertiserType = valueAfterLabel('Typ ogłoszeniodawcy');
        const buildingElevator = valueAfterLabel('Winda');
        const buildingType = valueAfterLabel('Rodzaj zabudowy');
        const windows = valueAfterLabel('Okna');
        const description = find(/\*\*Opis\*\*\s*([\s\S]*)$/i);
        const location = lines.find((line) => /(?:Katowice|Chorzów|Sosnowiec|Mysłowice|Tychy|Zabrze|Gliwice|Ruda Śląska|Świętochłowice|Czeladź|Będzin|Bytom)/i.test(line) && line.includes(',')) || '';
        const title = lines.find((line) => line.length > 12 && !/^(cena|powierzchnia|mieszkanie na sprzedaż|opis)$/i.test(line) && !/zł|m²/.test(line)) || '';
        const featureMap = ['balkon', 'winda', 'garaż', 'taras', 'oddzielna kuchnia', 'pom. użytkowe', 'garderoba', 'piwnica'];
        const features = featureMap.filter((feature) => text.toLowerCase().includes(feature));
        setNewPropertyLead((draft) => ({
            ...draft,
            url: rawUrl.trim() || draft.url,
            sourceText: text,
            title: title || draft.title,
            location: location || draft.location,
            price: priceDigits ? `${Number(priceDigits).toLocaleString('pl-PL')} zł` : draft.price,
            areaM2: area || draft.areaM2,
            rooms: rooms || draft.rooms,
            features: features.length ? features.join(', ') : draft.features,
            pricePerM2: pricePerM2 || draft.pricePerM2,
            heating: heating || draft.heating,
            floor: floor || draft.floor,
            rent: rent || draft.rent,
            finishCondition: finishCondition || draft.finishCondition,
            market: market || draft.market,
            ownership: ownership || draft.ownership,
            availableFrom: availableFrom || draft.availableFrom,
            advertiserType: advertiserType || draft.advertiserType,
            buildingElevator: buildingElevator || draft.buildingElevator,
            buildingType: buildingType || draft.buildingType,
            windows: windows || draft.windows,
            note: description || draft.note,
        }));
        setOtodomPaste('');
        setIsPropertyLeadOpen(true);
    };

    const startSourceImport = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!sourceUrl.trim() || !sourceText.trim()) return;
        const existing = propertyLeads.find((item) => item.url === sourceUrl.trim());
        if (existing) {
            alert('Ten link jest już zapisany jako pozysk.');
            setIsSourceImportOpen(false);
            setViewingPropertyLead(existing);
            return;
        }
        importOtodomPaste(sourceText, sourceUrl);
        setEditingPropertyLeadId(null);
        setSourceUrl('');
        setSourceText('');
        setIsSourceImportOpen(false);
    };

    const makeStageHistory = (stage: AcquisitionStage, note = ''): AcquisitionStageHistory => ({ id: crypto.randomUUID(), stage, label: ACQUISITION_STAGES.find((option) => option.id === stage)?.label || stage, note, createdAt: new Date().toISOString(), author: user?.email || 'Domiz Homes' });
    const callAuthor = user?.email || 'Tomasz Gnat';
    const patchPropertyLead = (id: string, patch: Partial<PropertyLead>) => {
        setPropertyLeads((previous) => previous.map((item) => item.id === id ? { ...item, ...patch } : item));
        setViewingPropertyLead((item) => item?.id === id ? { ...item, ...patch } : item);
    };
    const saveLeadPhone = async (id: string, phone: string) => {
        const ownerPhone = phone.trim();
        const updatedAt = new Date().toISOString();
        await updateDoc(doc(db, 'acquisitionListings', id), { ownerPhone, updatedAt });
        patchPropertyLead(id, { ownerPhone, updatedAt });
    };
    const saveCallCardResult = async (id: string, input: { result: CallResultId; note: string; callbackDate: string }) => {
        const lead = propertyLeadsRef.current.find((item) => item.id === id);
        if (!lead) throw new Error('Brak pozysku');
        const now = new Date().toISOString();
        const stage = stageForCallResult(lead.stage, input.result, Boolean(input.callbackDate));
        const note = formatCallNote(input.result, input.note, input.callbackDate);
        const stageHistory = [...(lead.stageHistory || []), makeStageHistory(stage, note)];
        const activities = [...(lead.activities || []), { id: crypto.randomUUID(), type: 'call' as const, summary: note, createdAt: now, author: callAuthor }];
        const updates: Partial<PropertyLead> = { callResult: input.result, lastCallAt: now, lastContactAt: now, updatedAt: now, stage, stageHistory, activities };
        if (input.callbackDate) {
            updates.callbackAt = callbackDateToIso(input.callbackDate);
            updates.tasks = [...(lead.tasks || []), { id: crypto.randomUUID(), title: 'Oddzwonić do właściciela', dueDate: input.callbackDate, owner: lead.assignee || callAuthor, status: 'open', createdAt: now }];
        }
        await updateDoc(doc(db, 'acquisitionListings', id), updates);
        patchPropertyLead(id, updates);
    };
    const prepareOwnerConsentLink = async (id: string) => {
        const lead = propertyLeadsRef.current.find((item) => item.id === id);
        if (!lead) throw new Error('Brak pozysku');
        let known = consentForLead(lead, ownerConsentsById);
        if (!known && lead.ownerConsentId) {
            const snap = await getDoc(doc(db, 'ownerConsents', lead.ownerConsentId));
            if (snap.exists()) known = { id: snap.id, ...(snap.data() as Omit<OwnerConsentLike, 'id'>) };
        }
        const knownStatus = consentCardStatus(known);
        if (known?.id && (knownStatus === 'link_sent' || knownStatus === 'confirmed_site' || knownStatus === 'confirmed_social')) {
            return { token: known.id, link: buildConsentLink(known.id), reused: true };
        }
        const token = newConsentToken();
        const expiresAt = Timestamp.fromMillis(Date.now() + CONSENT_TTL_MS);
        const writeConsent = (includeLeadId: boolean) => setDoc(doc(db, 'ownerConsents', token), {
            ...buildOwnerConsentFields(lead, includeLeadId),
            createdAt: serverTimestamp(),
            expiresAt,
        });
        try {
            await writeConsent(true);
        } catch (error) {
            const code = typeof error === 'object' && error && 'code' in error ? String((error as { code: unknown }).code) : '';
            if (!code.includes('permission-denied')) throw error;
            await writeConsent(false);
        }
        const now = new Date().toISOString();
        const stage = stageAfterConsentLink(lead.stage);
        const stageHistory = [...(lead.stageHistory || []), makeStageHistory(stage, 'Przygotowano link zgody do SMS-a. Wysyłka zostaje na telefonie Tomasza.')];
        const activities = [...(lead.activities || []), { id: crypto.randomUUID(), type: 'sms' as const, summary: 'Przygotowano SMS z linkiem zgody (nie wysłano automatycznie).', createdAt: now, author: callAuthor }];
        const updates: Partial<PropertyLead> = { ownerConsentId: token, stage, stageHistory, activities, lastContactAt: now, updatedAt: now };
        await updateDoc(doc(db, 'acquisitionListings', id), updates);
        patchPropertyLead(id, updates);
        setOwnerConsentsById((previous) => ({
            ...previous,
            [token]: { id: token, status: 'oczekuje', acquisitionListingId: lead.id, expiresAt: { toMillis: () => expiresAt.toMillis() } },
        }));
        return { token, link: buildConsentLink(token), reused: false };
    };

    const openCallFromQueue = (id: string) => {
        const lead = propertyLeads.find((item) => item.id === id);
        if (!lead) return;
        setCallTodayOnly(true);
        setActiveTab('acquisition');
        setViewingPropertyLead(lead);
    };

    useEffect(() => {
        propertyLeads.forEach((lead) => {
            const consent = consentForLead(lead, ownerConsentsById);
            if (!shouldCreateConsentDraft(lead, consent) || !consent?.id || consentDraftInFlight.current.has(lead.id)) return;
            consentDraftInFlight.current.add(lead.id);
            void (async () => {
                const propertyId = Date.now() + Math.floor(Math.random() * 1000);
                let created = false;
                try {
                    const draft = lead.propertyDraft;
                    const now = new Date().toISOString();
                    const price = draft?.price || Number((lead.price || '').replace(/[^\d]/g, '')) || 0;
                    const title = draft?.title || lead.title || 'Szkic oferty';
                    await setDoc(doc(db, 'properties', propertyId.toString()), {
                        id: propertyId,
                        title,
                        price,
                        location: draft?.location || lead.location || '',
                        beds: draft?.beds || lead.rooms || 0,
                        baths: draft?.baths || 0,
                        sqft: draft?.sqft || lead.areaM2 || 0,
                        type: draft?.type || 'mieszkanie',
                        status: draft?.status || 'sprzedaz',
                        description: draft?.description || lead.note || '',
                        features: draft?.features || [],
                        image: draft?.image || '',
                        images: draft?.images || [],
                        featured: false,
                        published: false,
                        agent: draft?.agent || { name: lead.assignee || 'Tomasz Gnat', phone: '', email: 'hello@domizhomes.com', image: '' },
                        acquisitionListingId: lead.id,
                        ownerConsentId: consent.id,
                        sourceAcquisitionId: lead.id,
                        sourceListingUrl: lead.url || '',
                        createdAt: now,
                        updatedAt: now,
                    });
                    created = true;
                    const stage = stageAfterConfirmedConsent(lead.stage) as AcquisitionStage;
                    const stageHistory = [...(lead.stageHistory || []), makeStageHistory(stage, 'Po potwierdzonej zgodzie na stronę powstał szkic oferty. Etap nie jest jeszcze „umowa podpisana”.')];
                    const updates = { draftPropertyId: propertyId, stage, stageHistory, updatedAt: now };
                    await updateDoc(doc(db, 'acquisitionListings', lead.id), updates);
                    patchPropertyLead(lead.id, updates);
                } catch (error) {
                    if (created) await deleteDoc(doc(db, 'properties', propertyId.toString())).catch(() => undefined);
                    consentDraftInFlight.current.delete(lead.id);
                    console.error('Nie udało się utworzyć szkicu oferty po zgodzie:', error);
                }
            })();
        });
    }, [propertyLeads, ownerConsentsById]);

    const setPropertyLeadStage = async (id: string, stage: AcquisitionStage) => {
        const current = propertyLeads.find((item) => item.id === id);
        if (!current || (current.stage || 'new') === stage) return;
        const stageHistory = [...(current.stageHistory || []), makeStageHistory(stage, 'Etap zmieniony ręcznie.')];
        try {
            await updateDoc(doc(db, 'acquisitionListings', id), { stage, stageHistory, updatedAt: new Date().toISOString() });
            setPropertyLeads((previous) => previous.map((item) => item.id === id ? { ...item, stage, stageHistory } : item));
            setViewingPropertyLead((item) => item?.id === id ? { ...item, stage, stageHistory } : item);
        } catch (error) {
            console.error('Błąd aktualizacji ogłoszenia:', error);
            alert('Nie udało się zaktualizować etapu ogłoszenia.');
        }
    };

    const setPropertyLeadAssignee = async (id: string, assignee: string) => {
        const current = propertyLeads.find((item) => item.id === id);
        if (!current || (current.assignee || '') === assignee) return;
        setSavingAssigneeId(id);
        try {
            const updatedAt = new Date().toISOString();
            await updateDoc(doc(db, 'acquisitionListings', id), { assignee, updatedAt });
            setPropertyLeads((previous) => previous.map((item) => item.id === id ? { ...item, assignee, updatedAt } : item));
            setViewingPropertyLead((item) => item?.id === id ? { ...item, assignee } : item);
        } catch (error) {
            console.error('Błąd przypisywania opiekuna:', error);
            alert('Nie udało się przypisać opiekuna. Spróbuj ponownie.');
        } finally {
            setSavingAssigneeId(null);
        }
    };

    const saveReadNotificationIds = (ids: string[]) => {
        const uniqueIds = Array.from(new Set(ids)).slice(-300);
        setReadNotificationIds(uniqueIds);
        localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(uniqueIds));
    };

    const openCrmNotification = (notification: CrmNotification) => {
        saveReadNotificationIds([...readNotificationIds, notification.id]);
        const lead = propertyLeads.find((item) => item.id === notification.leadId);
        if (lead) {
            setActiveTab('acquisition');
            setViewingPropertyLead(lead);
        }
        setNotificationsOpen(false);
    };

    const enableBrowserNotifications = async () => {
        if (!('Notification' in window) || !('serviceWorker' in navigator)) {
            alert('Ta przeglądarka nie obsługuje powiadomień PWA. Nadal możesz korzystać z centrum powiadomień w panelu.');
            return;
        }
        if (!user) {
            alert('Zaloguj się ponownie, aby przypisać to urządzenie do opiekuna.');
            return;
        }
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            setBrowserNotificationsEnabled(false);
            localStorage.removeItem(PUSH_NOTIFICATIONS_KEY);
            alert('Powiadomienia nie zostały włączone. Możesz zmienić zgodę w ustawieniach przeglądarki.');
            return;
        }
        const registration = await navigator.serviceWorker.ready;
        try {
            const { getMessaging, getToken, isSupported } = await import('firebase/messaging');
            if (!await isSupported()) throw new Error('FCM nie jest obsługiwane na tym urządzeniu.');
            const token = await getToken(getMessaging(app), { vapidKey: FIREBASE_VAPID_PUBLIC_KEY, serviceWorkerRegistration: registration });
            if (!token) throw new Error('Firebase nie zwrócił identyfikatora urządzenia.');
            let deviceId = localStorage.getItem(NOTIFICATION_DEVICE_KEY);
            if (!deviceId) {
                deviceId = crypto.randomUUID();
                localStorage.setItem(NOTIFICATION_DEVICE_KEY, deviceId);
            }
            await setDoc(doc(db, 'pushSubscriptions', `${user.uid}_${deviceId}`), { token, userId: user.uid, email: user.email || '', caretaker: notificationCaretaker, enabled: true, platform: navigator.userAgent, updatedAt: new Date().toISOString() }, { merge: true });
        } catch (error) {
            console.error('Błąd rejestracji FCM:', error);
            alert('Nie udało się zarejestrować urządzenia do powiadomień w tle. Spróbuj ponownie.');
            return;
        }
        setBrowserNotificationsEnabled(true);
        localStorage.setItem(PUSH_NOTIFICATIONS_KEY, 'enabled');
        localStorage.setItem(NOTIFICATION_CARETAKER_KEY, notificationCaretaker);
        await registration.showNotification('Domiz Homes CRM', { body: 'Powiadomienia zostały włączone.', icon: '/pwa/icon-192.png', badge: '/pwa/icon-192.png', tag: 'domiz-notifications-enabled', data: { url: '/admin' } });
    };

    useEffect(() => {
        if (!browserNotificationsEnabled || propertyLeadsLoading || !unreadNotifications.length || typeof Notification === 'undefined' || Notification.permission !== 'granted' || !('serviceWorker' in navigator)) return;
        let shownIds: string[] = [];
        try { shownIds = JSON.parse(localStorage.getItem(SHOWN_NOTIFICATIONS_KEY) || '[]') as string[]; } catch { shownIds = []; }
        const fresh = unreadNotifications.find((notification) => notification.priority >= 80 && !shownIds.includes(notification.id));
        if (!fresh) return;
        navigator.serviceWorker.ready.then((registration) => registration.showNotification(fresh.title, { body: `${fresh.body}${fresh.assignee ? ` · ${fresh.assignee}` : ''}`, icon: '/pwa/icon-192.png', badge: '/pwa/icon-192.png', tag: fresh.id, data: { url: '/admin', leadId: fresh.leadId } })).catch((error) => console.warn('Nie udało się pokazać powiadomienia:', error));
        localStorage.setItem(SHOWN_NOTIFICATIONS_KEY, JSON.stringify([...shownIds, fresh.id].slice(-300)));
    }, [browserNotificationsEnabled, propertyLeadsLoading, unreadNotifications]);

    const copyAcquisitionText = async (text: string, label = 'Tekst') => {
        try {
            await navigator.clipboard.writeText(text);
            alert(`${label} został skopiowany.`);
        } catch {
            alert('Nie udało się skopiować tekstu.');
        }
    };

    const exportAcquisitionsCsv = () => {
        const quote = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
        const rows = filteredPropertyLeads.map((item) => [
            item.title, item.location, item.price, item.areaM2, item.rooms,
            ACQUISITION_STAGES.find((stage) => stage.id === (item.stage || 'new'))?.label || 'Nowe ogłoszenie',
            item.assignee, item.ownerName, item.ownerPhone, item.sourceDetails?.advertiserType,
            item.proposal?.decisionDate, item.source || getListingSource(item.url), item.url, item.createdAt,
        ].map(quote).join(';'));
        const csv = [['Tytuł', 'Lokalizacja', 'Cena', 'm²', 'Pokoje', 'Etap', 'Opiekun', 'Właściciel', 'Telefon', 'Ogłoszeniodawca', 'Termin decyzji', 'Źródło', 'Link ogłoszenia', 'Data dodania'].map(quote).join(';'), ...rows].join('\n');
        const href = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' }));
        const link = document.createElement('a');
        link.href = href;
        link.download = `pozyski-domiz-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(href);
    };

    const deletePropertyLead = async (id: string) => {
        if (!window.confirm('Usunąć to ogłoszenie z procesu pozyskiwania?')) return;
        setDeletingPropertyLead(id);
        try {
            await deleteDoc(doc(db, 'acquisitionListings', id));
            setPropertyLeads((previous) => previous.filter((item) => item.id !== id));
        } catch (error) {
            console.error('Błąd usuwania ogłoszenia:', error);
            alert('Nie udało się usunąć ogłoszenia.');
        } finally {
            setDeletingPropertyLead(null);
        }
    };

    const addAcquisitionNote = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!noteTarget || !newAcquisitionNote.trim()) return;
        const note: AcquisitionNote = { id: crypto.randomUUID(), text: newAcquisitionNote.trim(), createdAt: new Date().toISOString(), author: user?.email || 'Domiz Homes' };
        const notes = [...(noteTarget.notes || []), note];
        setSavingAcquisitionNote(true);
        try {
            await updateDoc(doc(db, 'acquisitionListings', noteTarget.id), { notes, updatedAt: new Date().toISOString() });
            setPropertyLeads((previous) => previous.map((item) => item.id === noteTarget.id ? { ...item, notes } : item));
            setViewingPropertyLead((item) => item?.id === noteTarget.id ? { ...item, notes } : item);
            setNewAcquisitionNote('');
            setNoteTarget(null);
        } catch (error) {
            console.error('Błąd zapisu notatki:', error);
            alert('Nie udało się zapisać notatki.');
        } finally {
            setSavingAcquisitionNote(false);
        }
    };

    const addAcquisitionTask = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!taskTarget || !taskDraft.title.trim() || !taskDraft.dueDate) return;
        const task: AcquisitionTask = { id: crypto.randomUUID(), title: taskDraft.title.trim(), dueDate: taskDraft.dueDate, owner: taskDraft.owner.trim() || taskTarget.assignee || user?.email || 'Domiz Homes', status: 'open', createdAt: new Date().toISOString() };
        const tasks = [...(taskTarget.tasks || []), task];
        setSavingTask(true);
        try {
            await updateDoc(doc(db, 'acquisitionListings', taskTarget.id), { tasks, updatedAt: new Date().toISOString() });
            setPropertyLeads((previous) => previous.map((item) => item.id === taskTarget.id ? { ...item, tasks } : item));
            setViewingPropertyLead((item) => item?.id === taskTarget.id ? { ...item, tasks } : item);
            setTaskDraft({ title: '', dueDate: '', owner: '' });
            setTaskTarget(null);
        } catch (error) {
            console.error('Błąd dodawania zadania:', error);
            alert('Nie udało się dodać zadania.');
        } finally { setSavingTask(false); }
    };

    const addSuggestedTaskPlan = async (item: PropertyLead) => {
        const toDate = (offset: number) => { const value = new Date(); value.setDate(value.getDate() + offset); return value.toISOString().slice(0, 10); };
        const stage = item.stage || 'new';
        const templates: Record<AcquisitionStage, Array<{ title: string; offset: number }>> = {
            new: [{ title: 'Sprawdzić kompletność danych ogłoszenia', offset: 0 }, { title: 'Zakwalifikować ofertę do audytu', offset: 1 }],
            audit: [{ title: 'Wykonać audyt ogłoszenia', offset: 0 }, { title: 'Przygotować najważniejsze argumenty do kontaktu', offset: 1 }],
            ready_to_call: [{ title: 'Zadzwonić do właściciela', offset: 0 }, { title: 'Wysłać krótkie podsumowanie po rozmowie', offset: 1 }, { title: 'Wykonać follow-up po pierwszym kontakcie', offset: 3 }],
            contacted: [{ title: 'Ustalić termin rozmowy lub spotkania', offset: 1 }, { title: 'Zadzwonić ponownie do właściciela', offset: 3 }],
            consent_draft: [{ title: 'Uzupełnić szkic oferty', offset: 0 }, { title: 'Sprawdzić zgodę na stronę przed publikacją', offset: 1 }],
            meeting: [{ title: 'Przygotować spotkanie i audyt oferty', offset: 0 }, { title: 'Wysłać ofertę współpracy po spotkaniu', offset: 1 }],
            proposal: [{ title: 'Potwierdzić decyzję właściciela', offset: 1 }],
            acquired: [{ title: 'Dopilnować przygotowania aktywnej oferty', offset: 0 }],
            nurture: [{ title: 'Wrócić do właściciela z kontaktem', offset: 14 }],
            rejected: [{ title: 'Sprawdzić możliwość powrotu do kontaktu za 3 miesiące', offset: 90 }],
        };
        const existingTitles = new Set((item.tasks || []).filter((task) => task.status === 'open').map((task) => task.title));
        const newTasks = templates[stage].filter((template) => !existingTitles.has(template.title)).map((template) => ({ id: crypto.randomUUID(), title: template.title, dueDate: toDate(template.offset), owner: item.assignee || user?.email || 'Domiz Homes', status: 'open' as const, createdAt: new Date().toISOString() }));
        if (!newTasks.length) { alert('Wszystkie zadania z tego planu są już otwarte.'); return; }
        const tasks = [...(item.tasks || []), ...newTasks];
        try {
            await updateDoc(doc(db, 'acquisitionListings', item.id), { tasks, updatedAt: new Date().toISOString() });
            setPropertyLeads((previous) => previous.map((lead) => lead.id === item.id ? { ...lead, tasks } : lead));
            setViewingPropertyLead((lead) => lead?.id === item.id ? { ...lead, tasks } : lead);
            alert(`Dodano plan działań: ${newTasks.length} ${newTasks.length === 1 ? 'zadanie' : 'zadania'}.`);
        } catch (error) {
            console.error('Błąd dodawania planu działań:', error);
            alert('Nie udało się dodać planu działań.');
        }
    };

    const toggleAcquisitionTask = async (item: PropertyLead, taskId: string) => {
        const tasks = (item.tasks || []).map((task) => task.id === taskId ? { ...task, status: task.status === 'done' ? 'open' as const : 'done' as const } : task);
        try {
            await updateDoc(doc(db, 'acquisitionListings', item.id), { tasks, updatedAt: new Date().toISOString() });
            setPropertyLeads((previous) => previous.map((lead) => lead.id === item.id ? { ...lead, tasks } : lead));
            setViewingPropertyLead((lead) => lead?.id === item.id ? { ...lead, tasks } : lead);
        } catch (error) {
            console.error('Błąd aktualizacji zadania:', error);
            alert('Nie udało się zaktualizować zadania.');
        }
    };

    const addAcquisitionActivity = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!activityTarget || !activityDraft.summary.trim()) return;
        const activity: AcquisitionActivity = { id: crypto.randomUUID(), type: activityDraft.type, summary: activityDraft.summary.trim(), createdAt: new Date().toISOString(), author: user?.email || 'Domiz Homes' };
        const activities = [...(activityTarget.activities || []), activity];
        setSavingActivity(true);
        try {
            await updateDoc(doc(db, 'acquisitionListings', activityTarget.id), { activities, updatedAt: new Date().toISOString() });
            setPropertyLeads((previous) => previous.map((item) => item.id === activityTarget.id ? { ...item, activities } : item));
            setViewingPropertyLead((item) => item?.id === activityTarget.id ? { ...item, activities } : item);
            setActivityDraft({ type: 'call', summary: '' });
            setActivityTarget(null);
        } catch (error) {
            console.error('Błąd zapisu aktywności:', error);
            alert('Nie udało się zapisać aktywności.');
        } finally { setSavingActivity(false); }
    };

    const openCallOutcome = (item: PropertyLead) => {
        setCallOutcomeDraft({ outcome: 'no_answer', note: '', followUpDate: '' });
        setCallOutcomeTarget(item);
    };

    const saveCallOutcome = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!callOutcomeTarget) return;
        const labels: Record<CallOutcome, string> = { no_answer: 'Brak odpowiedzi', interested: 'Zainteresowany rozmową', meeting: 'Umówione spotkanie', not_now: 'Nie teraz', not_interested: 'Brak zainteresowania' };
        const stageByOutcome: Record<CallOutcome, AcquisitionStage> = { no_answer: 'contacted', interested: 'meeting', meeting: 'meeting', not_now: 'nurture', not_interested: 'rejected' };
        const stage = stageByOutcome[callOutcomeDraft.outcome];
        const activity: AcquisitionActivity = { id: crypto.randomUUID(), type: 'call', summary: `${labels[callOutcomeDraft.outcome]}${callOutcomeDraft.note.trim() ? `: ${callOutcomeDraft.note.trim()}` : ''}`, createdAt: new Date().toISOString(), author: user?.email || 'Domiz Homes' };
        const tasks = callOutcomeDraft.followUpDate ? [...(callOutcomeTarget.tasks || []), { id: crypto.randomUUID(), title: callOutcomeDraft.outcome === 'meeting' ? 'Przygotować umówione spotkanie' : 'Wykonać ustalony follow-up', dueDate: callOutcomeDraft.followUpDate, owner: callOutcomeTarget.assignee || user?.email || 'Domiz Homes', status: 'open' as const, createdAt: new Date().toISOString() }] : callOutcomeTarget.tasks || [];
        const activities = [...(callOutcomeTarget.activities || []), activity];
        const stageHistory = callOutcomeTarget.stage === stage ? callOutcomeTarget.stageHistory || [] : [...(callOutcomeTarget.stageHistory || []), makeStageHistory(stage, `Wynik rozmowy: ${labels[callOutcomeDraft.outcome]}.`)];
        const updates = { activities, tasks, stage, stageHistory, lastContactAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        setSavingCallOutcome(true);
        try {
            await updateDoc(doc(db, 'acquisitionListings', callOutcomeTarget.id), updates);
            setPropertyLeads((previous) => previous.map((item) => item.id === callOutcomeTarget.id ? { ...item, ...updates } : item));
            setViewingPropertyLead((item) => item?.id === callOutcomeTarget.id ? { ...item, ...updates } : item);
            setCallOutcomeTarget(null);
        } catch (error) {
            console.error('Błąd zapisu wyniku rozmowy:', error);
            alert('Nie udało się zapisać wyniku rozmowy.');
        } finally { setSavingCallOutcome(false); }
    };

    const uploadAcquisitionAttachment = async (item: PropertyLead, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setUploadingAttachmentId(item.id);
        try {
            const url = await uploadImage(file, `acquisitionListings/${item.id}/attachments`);
            const attachments = [...(item.attachments || []), { id: crypto.randomUUID(), name: file.name, url, uploadedAt: new Date().toISOString() }];
            await updateDoc(doc(db, 'acquisitionListings', item.id), { attachments, updatedAt: new Date().toISOString() });
            setPropertyLeads((previous) => previous.map((lead) => lead.id === item.id ? { ...lead, attachments } : lead));
            setViewingPropertyLead((lead) => lead?.id === item.id ? { ...lead, attachments } : lead);
        } catch (error) {
            console.error('Błąd wgrywania załącznika:', error);
            alert('Nie udało się wgrać załącznika.');
        } finally {
            setUploadingAttachmentId(null);
            event.target.value = '';
        }
    };

    const removeAcquisitionAttachment = async (item: PropertyLead, attachmentId: string) => {
        const attachments = (item.attachments || []).filter((attachment) => attachment.id !== attachmentId);
        try {
            await updateDoc(doc(db, 'acquisitionListings', item.id), { attachments, updatedAt: new Date().toISOString() });
            setPropertyLeads((previous) => previous.map((lead) => lead.id === item.id ? { ...lead, attachments } : lead));
            setViewingPropertyLead((lead) => lead?.id === item.id ? { ...lead, attachments } : lead);
        } catch (error) {
            console.error('Błąd usuwania załącznika:', error);
            alert('Nie udało się usunąć załącznika z pozysku.');
        }
    };

    const cooperationInquiries = useMemo(
        () => inquiries.filter((item) => item.type === 'client_cooperation_selection' && (item.payload?.packageId || item.payload?.packageName)),
        [inquiries],
    );

    const scoreInquiryMatch = (inquiry: Inquiry, lead: PropertyLead) => {
        let score = 0;
        const titleNeedle = (lead.title || '').toLowerCase().slice(0, 18);
        const locationNeedle = (lead.location || '').toLowerCase().slice(0, 18);
        const ownerNeedle = (lead.ownerName || '').toLowerCase();
        const inquiryTitle = String(inquiry.payload?.title || '').toLowerCase();
        const inquiryLocation = String(inquiry.payload?.location || '').toLowerCase();
        const inquiryName = String(inquiry.name || '').toLowerCase();
        if (titleNeedle && inquiryTitle.includes(titleNeedle)) score += 40;
        if (locationNeedle && inquiryLocation.includes(locationNeedle)) score += 25;
        if (ownerNeedle && inquiryName.includes(ownerNeedle)) score += 30;
        if (lead.ownerPhone && inquiry.phone && inquiry.phone.replace(/\D/g, '').includes(lead.ownerPhone.replace(/\D/g, ''))) score += 35;
        return score;
    };

    const resolvePackageFromInquiry = (inquiry: Inquiry): CooperationPackage => {
        const packageId = String(inquiry.payload?.packageId || '').toLowerCase();
        if (packageId in COOPERATION_PACKAGES) return packageId as CooperationPackage;
        const packageName = String(inquiry.payload?.packageName || '').toLowerCase();
        if (packageName.includes('signature')) return 'signature';
        if (packageName.includes('premium')) return 'premium';
        return 'start';
    };

    const applyInquiryToProposal = (inquiry: Inquiry) => {
        const variant = resolvePackageFromInquiry(inquiry);
        const services = expandProposalServices(variant, Array.isArray(inquiry.payload?.services) ? inquiry.payload.services.map(String).filter(Boolean) : defaultProposalServices(variant));
        setProposalDraft((draft) => ({
            ...draft,
            packageVariant: variant,
            selectedServices: services,
            scope: buildProposalScope(variant, services),
        }));
        setProposalInquiryId(inquiry.id);
        const serviceCount = Array.isArray(inquiry.payload?.services) ? inquiry.payload.services.length : 0;
        setProposalLoadNotice(`Wczytano wariant „${COOPERATION_PACKAGES[variant].label}”${serviceCount ? ` oraz ${serviceCount} wybrane działania` : ''} z zapytania.`);
    };

    const loadClientSelection = () => {
        if (!proposalTarget) return;
        const selected = cooperationInquiries.find((item) => item.id === proposalInquiryId);
        if (selected) {
            applyInquiryToProposal(selected);
            return;
        }
        const ranked = [...cooperationInquiries]
            .map((item) => ({ item, score: scoreInquiryMatch(item, proposalTarget) }))
            .sort((a, b) => b.score - a.score || String(b.item.createdAt || '').localeCompare(String(a.item.createdAt || '')));
        const best = ranked.find((entry) => entry.score > 0)?.item || ranked[0]?.item;
        if (!best) {
            setProposalLoadNotice('');
            alert('Nie znaleziono zapisanych wyborów z Panelu Klienta. Sprawdź listę zgłoszeń typu „wybór współpracy”.');
            return;
        }
        applyInquiryToProposal(best);
    };

    const openProposalEditor = (item: PropertyLead) => {
        const packageVariant = (item.proposal?.packageVariant && (item.proposal.packageVariant as string) in COOPERATION_PACKAGES) ? item.proposal.packageVariant : 'start';
        setProposalDraft({
            packageVariant,
            selectedServices: Array.isArray(item.proposal?.selectedServices) && item.proposal.selectedServices.length
                ? expandProposalServices(packageVariant, item.proposal.selectedServices)
                : [],
            scope: item.proposal?.scope || COOPERATION_PACKAGES[packageVariant].scope,
            commission: item.proposal?.commission || '',
            agreementType: item.proposal?.agreementType || 'Umowa na wyłączność',
            decisionDate: item.proposal?.decisionDate || '',
        });
        const ranked = [...cooperationInquiries]
            .map((inquiry) => ({ inquiry, score: scoreInquiryMatch(inquiry, item) }))
            .sort((a, b) => b.score - a.score || String(b.inquiry.createdAt || '').localeCompare(String(a.inquiry.createdAt || '')));
        const bestMatch = ranked.find((entry) => entry.score > 0)?.inquiry || null;
        setProposalInquiryId(bestMatch?.id || '');
        setProposalLoadNotice(bestMatch ? 'Dostępny wybór klienta z zapytania — możesz go wczytać poniżej.' : '');
        setProposalTarget(item);
    };

    const selectWizardProposalTarget = (item: PropertyLead) => {
        const packageVariant = (item.proposal?.packageVariant && (item.proposal.packageVariant as string) in COOPERATION_PACKAGES) ? item.proposal.packageVariant : 'start';
        setProposalTarget(item);
        setProposalDraft({
            packageVariant,
            selectedServices: Array.isArray(item.proposal?.selectedServices) ? expandProposalServices(packageVariant, item.proposal.selectedServices) : [],
            scope: item.proposal?.scope || '',
            commission: item.proposal?.commission || '',
            agreementType: item.proposal?.agreementType || 'Umowa na wyłączność',
            decisionDate: item.proposal?.decisionDate || '',
        });
        setProposalWizardStep(2);
    };

    const saveProposal = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!proposalTarget || !proposalDraft.scope.trim()) return;
        if (!proposalDraft.selectedServices.length) {
            alert('Wybierz co najmniej jedno działanie, które ma wejść do proposala.');
            return;
        }
        const proposal = {
            packageVariant: proposalDraft.packageVariant,
            selectedServices: proposalDraft.selectedServices,
            scope: proposalDraft.scope.trim(),
            commission: proposalDraft.commission.trim(),
            agreementType: proposalDraft.agreementType,
            decisionDate: proposalDraft.decisionDate,
            preparedAt: new Date().toISOString(),
        };
        const stageHistory = proposalTarget.stage === 'proposal' ? proposalTarget.stageHistory || [] : [...(proposalTarget.stageHistory || []), makeStageHistory('proposal', 'Przygotowano ofertę współpracy.')];
        const updates = { proposal, stage: 'proposal' as AcquisitionStage, stageHistory, updatedAt: new Date().toISOString() };
        setSavingProposal(true);
        try {
            await updateDoc(doc(db, 'acquisitionListings', proposalTarget.id), updates);
            setPropertyLeads((previous) => previous.map((item) => item.id === proposalTarget.id ? { ...item, ...updates } : item));
            setViewingPropertyLead((item) => item?.id === proposalTarget.id ? { ...item, ...updates } : item);
            setProposalTarget(null);
            setProposalInquiryId('');
            setProposalLoadNotice('');
        } catch (error) {
            console.error('Błąd zapisu oferty współpracy:', error);
            alert('Nie udało się zapisać oferty współpracy.');
        } finally { setSavingProposal(false); }
    };

    const createProposalFromWizard = async () => {
        if (!proposalTarget || !proposalDraft.selectedServices.length || !proposalDraft.scope.trim()) return;
        const now = new Date().toISOString();
        const proposal = {
            packageVariant: proposalDraft.packageVariant,
            selectedServices: proposalDraft.selectedServices,
            scope: proposalDraft.scope.trim(),
            commission: proposalDraft.commission.trim(),
            agreementType: proposalDraft.agreementType,
            decisionDate: proposalDraft.decisionDate,
            preparedAt: now,
        };
        const stageHistory = proposalTarget.stage === 'proposal' ? proposalTarget.stageHistory || [] : [...(proposalTarget.stageHistory || []), makeStageHistory('proposal', 'Przygotowano proposal w kreatorze.')];
        const updates = { proposal, stage: 'proposal' as AcquisitionStage, stageHistory, updatedAt: now };
        const target = { ...proposalTarget, ...updates } as PropertyLead;
        setSavingProposal(true);
        try {
            await updateDoc(doc(db, 'acquisitionListings', proposalTarget.id), updates);
            setPropertyLeads((previous) => previous.map((item) => item.id === proposalTarget.id ? { ...item, ...updates } : item));
            setViewingPropertyLead((item) => item?.id === proposalTarget.id ? target : item);
            const content = buildCooperationDocument(target, 'proposal');
            setDocumentTarget(target);
            setDocumentKind('proposal');
            setDocumentContent(content);
            await sendProposalToGamma(target, content);
            setIsProposalWizardOpen(false);
        } catch (error) {
            console.error('Błąd kreatora proposala:', error);
            alert('Nie udało się przygotować proposala. Spróbuj ponownie.');
        } finally { setSavingProposal(false); }
    };

    const openProposalDecision = (item: PropertyLead) => {
        setProposalDecisionDraft({ outcome: item.proposalDecision?.outcome || 'accepted', note: item.proposalDecision?.note || '' });
        setProposalDecisionTarget(item);
    };

    const saveProposalDecision = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!proposalDecisionTarget) return;
        const proposalDecision: ProposalDecision = { ...proposalDecisionDraft, note: proposalDecisionDraft.note.trim(), decidedAt: new Date().toISOString() };
        const stageByOutcome: Record<ProposalDecision['outcome'], AcquisitionStage> = { accepted: 'acquired', considering: 'nurture', declined: 'rejected' };
        const nextStage = stageByOutcome[proposalDecision.outcome];
        const stageHistory = [...(proposalDecisionTarget.stageHistory || []), makeStageHistory(nextStage, `Decyzja właściciela: ${proposalDecision.outcome === 'accepted' ? 'akceptacja współpracy' : proposalDecision.outcome === 'considering' ? 'czas do namysłu' : 'brak zainteresowania'}.`)];
        const updates = { proposalDecision, stage: nextStage, stageHistory, updatedAt: new Date().toISOString() };
        setSavingProposalDecision(true);
        try {
            await updateDoc(doc(db, 'acquisitionListings', proposalDecisionTarget.id), updates);
            setPropertyLeads((previous) => previous.map((item) => item.id === proposalDecisionTarget.id ? { ...item, ...updates } : item));
            setViewingPropertyLead((item) => item?.id === proposalDecisionTarget.id ? { ...item, ...updates } : item);
            setProposalDecisionTarget(null);
        } catch (error) {
            console.error('Błąd zapisu decyzji właściciela:', error);
            alert('Nie udało się zapisać decyzji właściciela.');
        } finally { setSavingProposalDecision(false); }
    };

    const buildCooperationDocument = (item: PropertyLead, kind: CooperationDocumentKind) => {
        const proposal = item.proposal;
        const today = new Date().toLocaleDateString('pl-PL');
        const propertyFacts = [item.location, item.areaM2 ? `${item.areaM2} m²` : '', item.rooms ? `${item.rooms} pok.` : ''].filter(Boolean).join(' · ');
        const recommendedPrice = item.auditData?.estimatedSalePrice || item.auditData?.estimatedSalePriceRange || item.price || 'do ustalenia po analizie porównawczej';
        const scope = proposal?.scope || item.auditData?.actionPlan || 'Profesjonalne przygotowanie nieruchomości, sesja zdjęciowa i wideo, opracowanie treści, dystrybucja ogłoszenia, obsługa prezentacji oraz negocjacji.';
        const packageLabel = proposal?.packageVariant ? COOPERATION_PACKAGES[proposal.packageVariant].label : 'Zakres indywidualny';
        const commission = proposal?.commission || '[do uzupełnienia]';
        const agreementType = proposal?.agreementType || 'Umowa na wyłączność';

        if (kind === 'proposal') return `PROPOZYCJA WSPÓŁPRACY\nDOMIZ HOMES\n\nData przygotowania: ${today}\nDla: ${item.ownerName || '[imię i nazwisko właściciela]'}\nNieruchomość: ${item.title || 'nieruchomość z pozysku'}\n${propertyFacts || '[adres i podstawowe parametry]'}\nWybrany wariant: ${packageLabel}\n\n1. CEL WSPÓŁPRACY\nCelem jest profesjonalne przygotowanie i przeprowadzenie sprzedaży nieruchomości w sposób, który zwiększa jej atrakcyjność, dociera do właściwej grupy kupujących i wspiera uzyskanie możliwie najlepszych warunków transakcji.\n\n2. REKOMENDOWANA STRATEGIA\n${item.auditData?.recommendedNextStep || item.auditSummary || 'Przygotowanie spójnej strategii prezentacji, ceny, promocji i kontaktu z kupującymi.'}\n\n3. PROPONOWANY ZAKRES DZIAŁAŃ — ${packageLabel.toUpperCase()}\n${scope}\n\n4. POZYCJONOWANIE I CENA\nRekomendowana cena / przedział po wdrożeniu zmian: ${recommendedPrice}.\n${item.auditData?.estimateRationale || item.auditData?.pricingRecommendation || 'Ostateczna rekomendacja zostanie potwierdzona po weryfikacji dokumentów, stanu nieruchomości i aktualnych danych porównawczych.'}\n\n5. MODEL WSPÓŁPRACY\nWariant: ${packageLabel}\nForma: ${agreementType}\nWynagrodzenie Domiz Homes: ${commission}\n\n6. CO OTRZYMUJE WŁAŚCICIEL\n• jednego opiekuna prowadzącego proces,\n• profesjonalną prezentację nieruchomości,\n• plan promocji i kwalifikację zainteresowanych,\n• organizację prezentacji oraz informację zwrotną,\n• wsparcie negocjacyjne i koordynację procesu do finalizacji.\n\n7. KOLEJNY KROK\n${item.auditData?.recommendedNextStep || 'Akceptacja zakresu, potwierdzenie warunków i podpisanie umowy pośrednictwa.'}\n${proposal?.decisionDate ? `Proponowany termin decyzji: ${new Date(`${proposal.decisionDate}T12:00:00`).toLocaleDateString('pl-PL')}.` : ''}\n\nOpiekun Domiz Homes: ${item.assignee || '[do przypisania]'}\n\nNiniejszy dokument jest propozycją handlową i nie stanowi umowy ani gwarancji ceny lub terminu sprzedaży.`;

        return `PROJEKT UMOWY POŚREDNICTWA W SPRZEDAŻY NIERUCHOMOŚCI\n\nsporządzony dnia ${today}\n\nWAŻNE: dokument roboczy — przed podpisaniem wymaga uzupełnienia danych stron, numerów identyfikacyjnych, danych nieruchomości oraz weryfikacji prawnej.\n\n§ 1. STRONY UMOWY\n1. Zamawiający: ${item.ownerName || '[imię i nazwisko / firma]'}, adres: [adres], PESEL/NIP: [numer], dokument tożsamości / KRS: [dane], dalej „Zamawiający”.\n2. Pośrednik: [pełna nazwa prawna Domiz Homes, adres, NIP/KRS, numer licencji / dane osoby odpowiedzialnej], dalej „Pośrednik”.\n\n§ 2. PRZEDMIOT UMOWY\n1. Zamawiający zleca Pośrednikowi wykonywanie czynności zmierzających do sprzedaży nieruchomości: ${item.title || '[rodzaj nieruchomości]'}, położonej: ${item.location || '[pełny adres]'}, o powierzchni ${item.areaM2 ? `${item.areaM2} m²` : '[powierzchnia]'}, dla której prowadzona jest księga wieczysta nr [numer KW].\n2. Cena ofertowa / strategia cenowa: ${recommendedPrice}. Ostateczna cena wymaga pisemnego potwierdzenia przez Zamawiającego.\n\n§ 3. PAKIET I ZAKRES CZYNNOŚCI POŚREDNIKA\n1. Strony wybierają wariant: ${packageLabel}.\n2. Uzgodniony zakres:\n${scope}\nPośrednik w szczególności przygotuje materiały ofertowe, przeprowadzi promocję, obsłuży zapytania i prezentacje, wesprze negocjacje oraz koordynację dokumentów transakcyjnych.\n\n§ 4. MODEL WSPÓŁPRACY I CZAS TRWANIA\n1. Strony wybierają formę: ${agreementType}.\n2. Umowa zostaje zawarta na okres od [data] do [data] / na czas nieokreślony z okresem wypowiedzenia [liczba] dni.\n3. Zasady wyłączności, rozwiązania umowy i obsługi klientów pozyskanych w trakcie jej obowiązywania wymagają uzupełnienia zgodnie z uzgodnieniami stron.\n\n§ 5. WYNAGRODZENIE\n1. Wynagrodzenie Pośrednika wynosi: ${commission}.\n2. Moment powstania obowiązku zapłaty, podstawa naliczenia, podatek VAT oraz termin płatności: [do uzupełnienia zgodnie z zaakceptowanymi warunkami].\n\n§ 6. OBOWIĄZKI ZAMAWIAJĄCEGO\nZamawiający zobowiązuje się przekazać prawdziwe i kompletne informacje, udostępnić dokumenty dotyczące stanu prawnego i technicznego, umożliwić przygotowanie materiałów i prezentacje oraz niezwłocznie informować o zmianach wpływających na sprzedaż.\n\n§ 7. DANE, MARKETING I KONTAKT\nZakres zgód na publikację zdjęć, filmu, planów, adresu oraz przetwarzanie danych osobowych zostanie określony w załącznikach i klauzulach informacyjnych zgodnych z obowiązującymi przepisami.\n\n§ 8. POSTANOWIENIA KOŃCOWE\n1. Zmiany umowy wymagają formy uzgodnionej przez strony.\n2. Załączniki, w tym protokół przekazania dokumentów, zgody marketingowe, klauzula informacyjna i karta nieruchomości, stanowią integralną część umowy.\n3. Umowę sporządzono w [liczba] jednobrzmiących egzemplarzach.\n\n______________________________          ______________________________\nZamawiający                              Pośrednik / Domiz Homes`;
    };

    const openCooperationDocument = (item: PropertyLead, kind: CooperationDocumentKind) => {
        const stored = kind === 'proposal' ? item.generatedProposal : item.generatedAgreement;
        setDocumentTarget(item);
        setDocumentKind(kind);
        setDocumentContent(stored?.content || buildCooperationDocument(item, kind));
        setGammaNotice(stored?.gamma?.gammaUrl ? 'Proposal jest dostępny w Gamma — link zapisany przy pozysku.' : '');
        setGoogleDocsNotice(kind === 'agreement' && stored?.google?.docsUrl ? 'Umowa jest dostępna w Google Docs — link zapisany przy pozysku.' : '');
    };

    const saveCooperationDocument = async () => {
        if (!documentTarget || !documentContent.trim()) return;
        const now = new Date().toISOString();
        const field = documentKind === 'proposal' ? 'generatedProposal' : 'generatedAgreement';
        const previousDocument = documentKind === 'proposal' ? documentTarget.generatedProposal : documentTarget.generatedAgreement;
        const generatedDocument: GeneratedCooperationDocument = {
            content: documentContent.trim(),
            generatedAt: previousDocument?.generatedAt || now,
            updatedAt: now,
            generatedBy: user?.email || 'Domiz Homes',
            ...(documentKind === 'proposal' && previousDocument?.gamma ? { gamma: previousDocument.gamma } : {}),
            ...(documentKind === 'agreement' && previousDocument?.google ? { google: previousDocument.google } : {}),
        };
        const stageHistory = previousDocument ? documentTarget.stageHistory || [] : [...(documentTarget.stageHistory || []), makeStageHistory('proposal', documentKind === 'proposal' ? 'Wygenerowano proposal dla właściciela.' : 'Wygenerowano projekt umowy pośrednictwa.')];
        const updates = { [field]: generatedDocument, stageHistory, updatedAt: now };
        setSavingDocument(true);
        try {
            await updateDoc(doc(db, 'acquisitionListings', documentTarget.id), updates);
            const mergedTarget = { ...documentTarget, ...updates } as PropertyLead;
            setPropertyLeads((previous) => previous.map((item) => item.id === documentTarget.id ? { ...item, ...updates } : item));
            setViewingPropertyLead((item) => item?.id === documentTarget.id ? { ...item, ...updates } as PropertyLead : item);
            setDocumentTarget(mergedTarget);
            alert(documentKind === 'proposal'
                ? 'Proposal zapisany w CRM. Do panelu klienta trafi dopiero po wysłaniu wersji z Gamma.'
                : 'Umowa zapisana i udostępniona klientowi do wglądu (PL/EN/IT).');
        } catch (error) {
            console.error('Błąd zapisu dokumentu współpracy:', error);
            alert('Nie udało się zapisać dokumentu.');
        } finally { setSavingDocument(false); }
    };

    const sendAgreementToGoogleDocs = async () => {
        if (!documentTarget || documentKind !== 'agreement' || !documentContent.trim()) return;
        setSendingToGoogleDocs(true);
        setGoogleDocsNotice('Wysyłam umowę do Google Docs…');
        try {
            const content = documentContent.trim();
            const listingId = documentTarget.id;
            const jobRef = await addDoc(collection(db, 'googleDocJobs'), {
                status: 'pending',
                listingId,
                content,
                title: documentTarget.title || '',
                createdBy: user?.email || 'Domiz Homes',
                createdAt: new Date().toISOString(),
            });

            await new Promise<void>((resolve, reject) => {
                const timeout = window.setTimeout(() => {
                    unsubscribe();
                    reject(new Error('Google Docs nadal tworzy dokument. Odśwież umowę za minutę.'));
                }, 120000);

                const unsubscribe = onSnapshot(jobRef, (snapshot) => {
                    const job = snapshot.data();
                    if (!job) return;
                    if (job.status === 'processing' || job.status === 'generating') {
                        setGoogleDocsNotice('Tworzę dokument w Google Docs…');
                        return;
                    }
                    if (job.status === 'failed') {
                        window.clearTimeout(timeout);
                        unsubscribe();
                        reject(new Error(String(job.error || 'Nie udało się utworzyć umowy w Google Docs.')));
                        return;
                    }
                    if (job.status === 'completed' && (job.docsUrl || job.viewUrl)) {
                        window.clearTimeout(timeout);
                        unsubscribe();
                        const now = new Date().toISOString();
                        const generatedAgreement: GeneratedCooperationDocument = {
                            content,
                            generatedAt: documentTarget.generatedAgreement?.generatedAt || now,
                            updatedAt: now,
                            generatedBy: user?.email || 'Domiz Homes',
                            google: {
                                docId: String(job.docId || ''),
                                docsUrl: String(job.docsUrl || ''),
                                viewUrl: String(job.viewUrl || job.docsUrl || ''),
                                status: 'completed',
                                jobId: jobRef.id,
                                createdAt: documentTarget.generatedAgreement?.google?.createdAt || now,
                                updatedAt: now,
                                createdBy: user?.email || 'Domiz Homes',
                            },
                        };
                        const updates = { generatedAgreement, updatedAt: now };
                        setPropertyLeads((previous) => previous.map((item) => item.id === listingId ? { ...item, ...updates } : item));
                        setViewingPropertyLead((item) => item?.id === listingId ? { ...item, ...updates } as PropertyLead : item);
                        setDocumentTarget((current) => current?.id === listingId ? { ...current, ...updates } as PropertyLead : current);
                        setGoogleDocsNotice('Umowa utworzona w Google Docs i udostępniona w panelu klienta.');
                        window.open(String(job.docsUrl || job.viewUrl), '_blank', 'noopener,noreferrer');
                        resolve();
                    }
                }, (error) => {
                    window.clearTimeout(timeout);
                    reject(error);
                });
            });
        } catch (error) {
            console.error('Błąd Google Docs:', error);
            const message = error instanceof Error ? error.message : 'Nie udało się wysłać umowy do Google Docs.';
            setGoogleDocsNotice('');
            alert(message);
        } finally {
            setSendingToGoogleDocs(false);
        }
    };

    const republishAgreementToClientPortal = async (listingId?: string) => {
        const id = listingId || documentTarget?.id;
        const content = documentTarget?.generatedAgreement?.content || documentContent.trim();
        if (!id || !content) {
            alert('Najpierw zapisz treść umowy.');
            return;
        }
        setGoogleDocsNotice('Udostępniam umowę w panelu klienta…');
        try {
            const now = new Date().toISOString();
            await updateDoc(doc(db, 'acquisitionListings', id), {
                'generatedAgreement.content': content,
                'generatedAgreement.updatedAt': now,
                updatedAt: now,
            });
            setGoogleDocsNotice('Umowa wypchnięta do panelu klienta do wglądu. Odśwież /panel-klienta.');
        } catch (error) {
            console.error('Błąd republish umowy:', error);
            const message = error instanceof Error ? error.message : 'Nie udało się udostępnić umowy w panelu klienta.';
            setGoogleDocsNotice('');
            alert(message);
        }
    };

    const sendProposalToGamma = async (target = documentTarget, contentOverride?: string) => {
        const content = (contentOverride || documentContent).trim();
        if (!target || (!contentOverride && documentKind !== 'proposal') || !content) return;
        setSendingToGamma(true);
        setGammaNotice('Wysyłam proposal do Gamma…');
        try {
            const listingId = target.id;
            const jobRef = await addDoc(collection(db, 'gammaJobs'), {
                status: 'pending',
                listingId,
                content,
                title: target.title || '',
                versionId: crypto.randomUUID(),
                versionNumber: (target.proposalVersions?.length || 0) + 1,
                publishToClient: false,
                createdBy: user?.email || 'Domiz Homes',
                createdAt: new Date().toISOString(),
            });

            await new Promise<void>((resolve, reject) => {
                const timeout = window.setTimeout(() => {
                    unsubscribe();
                    reject(new Error('Gamma nadal generuje prezentację. Odśwież proposal za minutę.'));
                }, 120000);

                const unsubscribe = onSnapshot(jobRef, (snapshot) => {
                    const job = snapshot.data();
                    if (!job) return;
                    if (job.status === 'processing' || job.status === 'generating') {
                        setGammaNotice('Gamma generuje prezentację…');
                        return;
                    }
                    if (job.status === 'failed') {
                        window.clearTimeout(timeout);
                        unsubscribe();
                        reject(new Error(String(job.error || 'Nie udało się wygenerować proposala w Gamma.')));
                        return;
                    }
                    if (job.status === 'completed' && job.gammaUrl) {
                        window.clearTimeout(timeout);
                        unsubscribe();
                        const now = new Date().toISOString();
                        const generatedProposal: GeneratedCooperationDocument = {
                            content,
                            generatedAt: target.generatedProposal?.generatedAt || now,
                            updatedAt: now,
                            generatedBy: user?.email || 'Domiz Homes',
                            gamma: {
                                generationId: String(job.generationId || ''),
                                gammaId: String(job.gammaId || ''),
                                gammaUrl: String(job.gammaUrl || ''),
                                exportUrl: String(job.exportUrl || ''),
                                status: 'completed',
                                jobId: jobRef.id,
                                createdAt: target.generatedProposal?.gamma?.createdAt || now,
                                updatedAt: now,
                                createdBy: user?.email || 'Domiz Homes',
                            },
                            versionId: String(job.versionId || jobRef.id),
                            versionNumber: Number(job.versionNumber || (target.proposalVersions?.length || 0) + 1),
                        };
                        const updates = { generatedProposal, proposalVersions: [...(target.proposalVersions || []), { ...generatedProposal, id: generatedProposal.versionId || jobRef.id }], updatedAt: now };
                        setPropertyLeads((previous) => previous.map((item) => item.id === listingId ? { ...item, ...updates } : item));
                        setViewingPropertyLead((item) => item?.id === listingId ? { ...item, ...updates } as PropertyLead : item);
                        setDocumentTarget((current) => current?.id === listingId ? { ...current, ...updates } as PropertyLead : current);
                        setGammaNotice('Proposal jest gotowy w Gamma. Sprawdź go, a potem użyj „Udostępnij w panelu klienta”.');
                        window.open(String(job.gammaUrl), '_blank', 'noopener,noreferrer');
                        resolve();
                    }
                }, (error) => {
                    window.clearTimeout(timeout);
                    reject(error);
                });
            });
        } catch (error) {
            console.error('Błąd Gamma:', error);
            const message = error instanceof Error ? error.message : 'Nie udało się wysłać proposala do Gamma.';
            setGammaNotice('');
            alert(message);
        } finally {
            setSendingToGamma(false);
        }
    };

    const republishProposalToClientPortal = async (listingId?: string) => {
        const id = listingId || documentTarget?.id;
        const target = documentTarget || propertyLeads.find((item) => item.id === id);
        const gamma = target?.generatedProposal?.gamma;
        if (!id || !gamma?.gammaUrl) {
            alert('Najpierw wygeneruj proposal w Gamma.');
            return;
        }
        setGammaNotice('Udostępniam proposal w panelu klienta…');
        try {
            // Aktualizacja listingów odpala syncGwiazdyClientDocuments (bez callable — org IAM blokuje invoker).
            const now = new Date().toISOString();
            await updateDoc(doc(db, 'acquisitionListings', id), {
                'generatedProposal.updatedAt': now,
                'generatedProposal.gamma.updatedAt': now,
                'generatedProposal.gamma.republishedAt': now,
                'generatedProposal.gamma.publishedAt': now,
                updatedAt: now,
            });
            const updates = { generatedProposal: target?.generatedProposal ? { ...target.generatedProposal, gamma: { ...target.generatedProposal.gamma, publishedAt: now, updatedAt: now } } : undefined, updatedAt: now };
            setPropertyLeads((previous) => previous.map((item) => item.id === id ? { ...item, ...updates } : item));
            setDocumentTarget((current) => current?.id === id ? { ...current, ...updates } as PropertyLead : current);
            setGammaNotice('Proposal jest udostępniony w panelu klienta.');
        } catch (error) {
            console.error('Błąd republish panelu klienta:', error);
            const message = error instanceof Error ? error.message : 'Nie udało się udostępnić w panelu klienta.';
            setGammaNotice('');
            alert(message);
        }
    };

    const printCooperationDocument = () => {
        if (!documentTarget || !documentContent.trim()) return;
        const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character] || character));
        const popup = window.open('', '_blank', 'noopener,noreferrer');
        if (!popup) { alert('Przeglądarka zablokowała okno wydruku. Zezwól na wyskakujące okna i spróbuj ponownie.'); return; }
        const title = documentKind === 'proposal' ? 'Proposal Domiz Homes' : 'Projekt umowy Domiz Homes';
        popup.document.write(`<!doctype html><html lang="pl"><head><meta charset="utf-8"><title>${title}</title><style>@page{margin:18mm}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#171717;line-height:1.55;max-width:820px;margin:0 auto;font-size:13px}header{border-bottom:2px solid #171717;padding-bottom:18px;margin-bottom:24px}header small{letter-spacing:.18em;font-weight:700}h1{font-size:25px;margin:7px 0 0}.content{white-space:pre-wrap}.footer{margin-top:32px;padding-top:15px;border-top:1px solid #ddd;color:#666;font-size:10px}@media print{button{display:none}}</style></head><body><header><small>DOMIZ HOMES</small><h1>${escapeHtml(title)}</h1></header><div class="content">${escapeHtml(documentContent)}</div><div class="footer">Dokument wygenerowany w Domiz Homes CRM · ${new Date().toLocaleString('pl-PL')}</div><script>window.addEventListener('load',()=>window.print())<\/script></body></html>`);
        popup.document.close();
    };

    const requestActivePropertyConversion = async (item: PropertyLead, prepareExisting = false) => {
        if (item.activePropertyId && !prepareExisting) {
            navigate(`/admin/properties/${item.activePropertyId}/edit`);
            return;
        }
        if (!item.propertyDraft?.title || !item.propertyDraft.location) {
            alert('Uzupełnij najpierw podstawowe dane oferty.');
            return;
        }
        const polishAudit = item.auditTranslations?.pl?.auditData || item.auditData;
        setConversionOptions({ priceMode: parseCurrencyValue(polishAudit?.estimatedSalePrice) ? 'audit' : 'current', publishNow: false, propertyMode: item.activePropertyId ? 'update' : 'new' });
        setConversionTarget(item);
    };

    const createActiveProperty = async (item: PropertyLead) => {
        if (!item.propertyDraft) return;
        const draft = item.propertyDraft;
        const polishShowcase = item.showcaseOfferTranslations?.pl || item.showcaseOffer;
        const englishShowcase = item.showcaseOfferTranslations?.en;
        const polishAudit = item.auditTranslations?.pl?.auditData || item.auditData;
        const recommendedPrice = parseCurrencyValue(polishAudit?.estimatedSalePrice);
        const imageCandidates = Array.from(new Set([draft.image, ...(draft.images || [])].filter(Boolean)));
        const finalTitle = polishShowcase?.title || draft.title;
        const finalDescription = polishShowcase?.description || draft.description;
        const finalFeatures = polishShowcase?.highlights?.length ? polishShowcase.highlights : draft.features;
        const finalPrice = conversionOptions.priceMode === 'audit' && recommendedPrice ? recommendedPrice : draft.price;
        setConvertingPropertyLead(item.id);
        try {
            const updatingExisting = Boolean(item.activePropertyId && conversionOptions.propertyMode === 'update');
            const propertyId = updatingExisting ? item.activePropertyId as number : Date.now();
            const now = new Date().toISOString();
            const compactDescription = finalDescription.replace(/\s+/g, ' ').trim();
            const seoTitle = `${finalTitle} | Domiz Homes`.slice(0, 60);
            const seoDescription = (compactDescription || `${draft.type} — ${draft.location}`).slice(0, 160);
            const consent = consentForLead(item, ownerConsentsById);
            const publishReason = publishBlockReason(consent);
            const canPublishNow = conversionOptions.publishNow && !publishReason;
            if (conversionOptions.publishNow && publishReason) alert(publishReason);
            const propertyPayload = {
                ...draft,
                id: propertyId,
                title: finalTitle,
                description: finalDescription,
                features: finalFeatures,
                price: finalPrice,
                image: imageCandidates[0] || '',
                images: imageCandidates.slice(1),
                agent: { ...draft.agent, name: item.assignee || draft.agent.name },
                published: canPublishNow,
                ownerConsentId: consent?.id || item.ownerConsentId || '',
                acquisitionListingId: item.id,
                seoTitle,
                seoDescription,
                seoKeywords: [draft.type, draft.location, finalTitle, 'Domiz Homes'].filter(Boolean).join(', '),
                seoSlug: createSlug(finalTitle),
                sourceAcquisitionId: item.id,
                sourceListingUrl: item.url,
                ...(!updatingExisting ? { createdAt: now } : {}),
                updatedAt: now,
                ...(polishAudit?.estimatedSalePrice ? { auditEstimatedSalePrice: polishAudit.estimatedSalePrice } : {}),
                ...(polishAudit?.estimatedSalePriceRange ? { auditEstimatedSalePriceRange: polishAudit.estimatedSalePriceRange } : {}),
                ...(polishShowcase ? { showcaseGeneratedAt: polishShowcase.generatedAt, showcasePhotoPlan: polishShowcase.photoPlaceholders } : {}),
                ...(englishShowcase ? { titleEn: englishShowcase.title, descriptionEn: englishShowcase.description, featuresEn: englishShowcase.highlights } : {}),
            };
            await setDoc(doc(db, 'properties', propertyId.toString()), propertyPayload, { merge: updatingExisting });
            const nextStage: AcquisitionStage = item.stage === 'acquired' || item.stage === 'rejected' ? item.stage : 'consent_draft';
            const stageHistory = [...(item.stageHistory || []), makeStageHistory(nextStage, canPublishNow ? 'Oferta opublikowana po zgodzie na stronę.' : 'Utworzono szkic oferty. Etap nie przechodzi od razu na „umowa podpisana”.')];
            const updates = { activePropertyId: propertyId, draftPropertyId: item.draftPropertyId || propertyId, convertedAt: now, stage: nextStage, stageHistory, updatedAt: now };
            await updateDoc(doc(db, 'acquisitionListings', item.id), updates);
            setPropertyLeads((previous) => previous.map((lead) => lead.id === item.id ? { ...lead, ...updates } : lead));
            setViewingPropertyLead((lead) => lead?.id === item.id ? { ...lead, ...updates } : lead);
            setConversionTarget(null);
            alert(updatingExisting ? 'Oferta na stronie została zaktualizowana. Bez zgody na stronę zostaje szkicem.' : canPublishNow ? 'Oferta została opublikowana, bo jest zgoda na stronę.' : 'Szkic oferty został utworzony. Publikacja czeka na zgodę właściciela na stronę.');
            navigate(`/admin/properties/${propertyId}/edit`);
        } catch (error) {
            console.error('Błąd konwersji do aktywnej oferty:', error);
            alert('Nie udało się utworzyć aktywnej oferty.');
        } finally { setConvertingPropertyLead(null); }
    };

    const openAudit = (item: PropertyLead) => {
        const saved = item.auditData;
        setAuditDraft({ ...saved, photos: saved?.photos || '', description: saved?.description || '', price: saved?.price || '', targetAudience: saved?.targetAudience || '', actionPlan: saved?.actionPlan || '' });
        setAuditTarget(item);
    };

    const saveAudit = async (moveToReadyToCall: boolean) => {
        if (!auditTarget) return;
        const summary = [
            auditDraft.photos && `Zdjęcia i ekspozycja: ${auditDraft.photos}`,
            auditDraft.description && `Opis ogłoszenia: ${auditDraft.description}`,
            auditDraft.price && `Cena i pozycjonowanie: ${auditDraft.price}`,
            auditDraft.targetAudience && `Grupa docelowa: ${auditDraft.targetAudience}`,
            auditDraft.actionPlan && `Plan działania: ${auditDraft.actionPlan}`,
        ].filter(Boolean).join('\n\n');
        if (!summary) {
            alert('Uzupełnij przynajmniej jeden element audytu.');
            return;
        }
        setSavingAudit(true);
        const stageHistory = moveToReadyToCall && auditTarget.stage !== 'ready_to_call' ? [...(auditTarget.stageHistory || []), makeStageHistory('ready_to_call', 'Audyt ukończony; pozysk przygotowany do kontaktu.')] : auditTarget.stageHistory || [];
        const updates = { auditData: auditDraft, auditSummary: summary, auditedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), stageHistory, ...(moveToReadyToCall ? { stage: 'ready_to_call' as AcquisitionStage } : {}) };
        try {
            await updateDoc(doc(db, 'acquisitionListings', auditTarget.id), updates);
            setPropertyLeads((previous) => previous.map((item) => item.id === auditTarget.id ? { ...item, ...updates } : item));
            setViewingPropertyLead((item) => item?.id === auditTarget.id ? { ...item, ...updates } : item);
            setAuditTarget(null);
        } catch (error) {
            console.error('Błąd zapisu audytu:', error);
            alert('Nie udało się zapisać audytu.');
        } finally {
            setSavingAudit(false);
        }
    };

    const generateAiAudit = async (listingId: string, agentComments = '', listingOverride?: PropertyLead, preserveStage = false) => {
        const listing = listingOverride || propertyLeads.find((item) => item.id === listingId);
        if (!listing) return false;
        setGeneratingAuditId(listingId);
        try {
            const settingsSnapshot = await getDoc(doc(db, 'configs', 'seo'));
            const apiKey = settingsSnapshot.data()?.geminiApiKey?.trim();
            if (!apiKey) throw new Error('Najpierw dodaj klucz Google Gemini w zakładce „Ustawienia SEO & AI”.');

            const draft = listing.propertyDraft;
            const prompt = `Jesteś seniorem strategii marketingu nieruchomości w Domiz Homes. Przygotuj dwie pełne, równoważne językowo wersje zaawansowanego audytu ogłoszenia na podstawie wyłącznie poniższych danych z CRM: polską w polu "pl" i angielską w polu "en". Nie oceniaj osoby sprzedającej ani konkurencji i nie wymyślaj brakujących informacji.

Metodyka oceny:
- oceń w skali 0–100: zdjęcia, opis, cenę, pozycjonowanie, kompletność danych i potencjał konwersji;
- wynik ogólny wylicz jako ważoną ocenę: zdjęcia 20%, opis 15%, cena 20%, pozycjonowanie 20%, kompletność 15%, konwersja 10%;
- oddziel fakty z ogłoszenia od hipotez i jasno nazwij braki danych;
- nie oceniaj rynkowej poprawności ceny bez danych porównawczych; zamiast tego oceń sposób uzasadnienia i komunikowania ceny;
- wskaż 3–5 mocnych stron, ryzyk i szybkich usprawnień;
- określ najbardziej prawdopodobnego kupującego, jego motywacje i obiekcje;
- przygotuj plan zdjęć, kanały promocji, strategię wyróżnienia i plan działań na pierwsze 7 dni;
- zaproponuj lepszy tytuł, rekomendację cenową dotyczącą prezentacji wartości oraz pytania do właściciela;
- przygotuj merytoryczny kąt rozpoczęcia rozmowy i jednoznaczny kolejny krok, bez krytykowania obecnej oferty;
- oszacuj możliwą cenę sprzedaży po wdrożeniu rekomendowanych zmian, podając cenę najbardziej prawdopodobną, przedział, czas sprzedaży, poziom pewności i założenia;
- estymację ceny traktuj jako hipotezę komercyjną na podstawie danych z CRM, a nie operat szacunkowy; nie deklaruj gwarantowanej ceny i zaznacz potrzebę potwierdzenia analizą ofert porównywalnych;
- rekomendacje mają być konkretne, operacyjne i zwięzłe;
- wersja "pl" ma być napisana naturalnym językiem polskim, a wersja "en" naturalnym, profesjonalnym językiem angielskim;
- obie wersje muszą zawierać te same fakty, oceny liczbowe, prognozy i rekomendacje — wersja angielska nie może być skrótem;
- kwoty pozostaw w walucie źródłowej i nie przeliczaj ich między walutami.

DANE POZYSKU:
${JSON.stringify({ title: listing.title, location: listing.location, price: listing.price, areaM2: listing.areaM2 || draft?.sqft, rooms: listing.rooms || draft?.beds, description: listing.note || draft?.description, features: draft?.features || [], sourceDetails: listing.sourceDetails || {}, photosAttached: draft?.images?.length || (draft?.image ? 1 : 0), sourceText: listing.sourceText?.slice(0, 14000) || '' })}

UWAGI AGENTA DO POPRZEDNIEGO AUDYTU:
${agentComments.trim() || 'Brak dodatkowych uwag.'}

Jeżeli podano uwagi agenta, przygotuj cały audyt od nowa i uwzględnij je we wszystkich odpowiednich sekcjach. Traktuj je jako wiedzę operacyjną zespołu, ale nie przedstawiaj jako pewnego faktu informacji sprzecznych z danymi źródłowymi. W razie sprzeczności jasno zaznacz potrzebę weryfikacji.`;
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        maxOutputTokens: 16384,
                        temperature: 0.25,
                        responseMimeType: 'application/json',
                        responseSchema: { type: 'OBJECT', properties: { pl: AUDIT_CONTENT_SCHEMA, en: AUDIT_CONTENT_SCHEMA }, required: ['pl', 'en'] },
                    },
                }),
            });
            if (!response.ok) {
                const details = await response.text();
                console.error('Gemini audit error:', response.status, details);
                throw new Error(response.status === 429 ? 'Limit zapytań Gemini został chwilowo przekroczony. Spróbuj ponownie za moment.' : 'Gemini nie wygenerował audytu. Sprawdź klucz API w ustawieniach.');
            }
            const responseData = await response.json();
            const jsonText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!jsonText) throw new Error('Gemini zwrócił pustą odpowiedź. Spróbuj ponownie.');
            const generated = JSON.parse(jsonText);
            const polishAudit = normalizeGeneratedAudit(generated.pl, 'pl');
            const englishAudit = normalizeGeneratedAudit(generated.en, 'en');
            const auditTranslations: Record<AuditLanguage, LocalizedAudit> = { pl: polishAudit, en: englishAudit };
            const { auditData, auditSummary } = polishAudit;
            const now = new Date().toISOString();
            const auditHistoryStage = preserveStage ? listing.stage || 'acquired' : 'audit';
            const stageHistory = [...(listing.stageHistory || []), makeStageHistory(auditHistoryStage, 'Audyt wygenerowany automatycznie przez Gemini — do weryfikacji przez zespół.')];
            const auditVersion: AuditVersion = { id: crypto.randomUUID(), generatedAt: now, auditData, auditSummary, auditTranslations, ...(agentComments.trim() ? { agentComments: agentComments.trim() } : {}) };
            const auditVersions = [...(listing.auditVersions || []), auditVersion].slice(-10);
            const auditFeedback = agentComments.trim() ? [...(listing.auditFeedback || []), { id: crypto.randomUUID(), text: agentComments.trim(), createdAt: now, author: 'Administrator' }].slice(-20) : listing.auditFeedback || [];
            const updates = { auditData, auditSummary, auditTranslations, auditVersions, auditFeedback, auditedAt: now, updatedAt: now, ...(preserveStage ? {} : { stage: 'audit' as AcquisitionStage }), stageHistory };
            await updateDoc(doc(db, 'acquisitionListings', listingId), updates);
            setPropertyLeads((previous) => previous.map((item) => item.id === listingId ? { ...item, ...updates } : item));
            setViewingPropertyLead((item) => item?.id === listingId ? { ...item, ...updates } : item);
            setAuditTarget((item) => item?.id === listingId ? { ...item, ...updates } : item);
            return true;
        } catch (error: any) {
            console.error('Błąd generowania audytu AI:', error);
            alert(error?.message || 'Nie udało się wygenerować audytu AI.');
            return false;
        } finally {
            setGeneratingAuditId(null);
        }
    };

    const improvePropertyDescription = async (property: Property) => {
        setImprovingDescriptionId(property.id);
        try {
            const settingsSnapshot = await getDoc(doc(db, 'configs', 'seo'));
            const apiKey = settingsSnapshot.data()?.geminiApiKey?.trim();
            if (!apiKey) throw new Error('Najpierw dodaj klucz Google Gemini w zakładce „Ustawienia SEO & AI”.');

            const prompt = `Jesteś copywriterem biura nieruchomości Domiz Homes. Usprawnij opis oferty do standardu Domiz Homes.

Zasady:
- korzystaj wyłącznie z potwierdzonych danych z oferty; nie dopisuj standardu, widoków, odległości, stanu prawnego ani wyposażenia, których nie ma w danych;
- jeżeli fakt wymaga potwierdzenia, pomiń go zamiast zgadywać;
- nie używaj pustych superlatywów (np. „wyjątkowa”, „idealna”, „luksusowa”, „prestiżowa”, „godna uwagi”);
- nie twórz presji zakupowej;
- opis PL: zacznij od 1–2 zdań z najsilniejszą potwierdzoną cechą i lokalizacją, potem dokładnie cztery sekcje z nagłówkami: „ATUTY NIERUCHOMOŚCI”, „UKŁAD I STANDARD”, „LOKALIZACJA”, „DLA KOGO”; na końcu „ZAPRASZAMY NA PREZENTACJĘ” i jedno neutralne zdanie zachęcające do kontaktu;
- w sekcjach ATUTY oraz UKŁAD I STANDARD używaj krótkich punktów z „•”;
- opis EN: ta sama struktura faktów i kolejność, z nagłówkami „PROPERTY HIGHLIGHTS”, „LAYOUT AND STANDARD”, „LOCATION”, „WHO IT SUITS”, na końcu „BOOK A VIEWING”;
- kwoty i jednostki pozostaw w formacie źródłowym;
- zwróć wyłącznie JSON zgodny ze schematem.

DANE OFERTY:
${JSON.stringify({
                title: property.title,
                titleEn: property.titleEn || '',
                price: property.price,
                location: property.location,
                type: property.type,
                status: property.status,
                sqft: property.sqft,
                beds: property.beds,
                baths: property.baths,
                features: property.features || [],
                featuresEn: property.featuresEn || [],
                description: property.description || '',
                descriptionEn: property.descriptionEn || '',
            })}`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        maxOutputTokens: 8192,
                        temperature: 0.25,
                        responseMimeType: 'application/json',
                        responseSchema: {
                            type: 'OBJECT',
                            properties: {
                                description: { type: 'STRING' },
                                descriptionEn: { type: 'STRING' },
                            },
                            required: ['description', 'descriptionEn'],
                        },
                    },
                }),
            });

            if (!response.ok) {
                const details = await response.text();
                console.error('Gemini improve description error:', response.status, details);
                throw new Error(response.status === 429
                    ? 'Limit zapytań Gemini został chwilowo przekroczony. Spróbuj ponownie za moment.'
                    : 'Nie udało się usprawnić opisu. Sprawdź klucz AI.');
            }

            const responseData = await response.json();
            const jsonText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!jsonText) throw new Error('Gemini zwrócił pustą odpowiedź. Spróbuj ponownie.');

            const generated = JSON.parse(jsonText) as { description?: string; descriptionEn?: string };
            const description = String(generated.description || '').trim();
            const descriptionEn = String(generated.descriptionEn || '').trim();
            if (description.length < 80 || descriptionEn.length < 80) {
                throw new Error('Wygenerowany opis jest zbyt krótki. Spróbuj ponownie.');
            }

            setDescriptionImproveTarget({ property, description, descriptionEn });
        } catch (error: unknown) {
            console.error('Błąd usprawniania opisu:', error);
            alert(error instanceof Error ? error.message : 'Nie udało się usprawnić opisu oferty.');
        } finally {
            setImprovingDescriptionId(null);
        }
    };

    const applyImprovedDescription = async () => {
        if (!descriptionImproveTarget) return;
        const { property, description, descriptionEn } = descriptionImproveTarget;
        setDescriptionImproveTarget({ ...descriptionImproveTarget, saving: true });
        try {
            await updateDoc(doc(db, 'properties', property.id.toString()), {
                description,
                descriptionEn,
                descriptionImprovedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
            setDescriptionImproveTarget(null);
        } catch (error: unknown) {
            console.error('Błąd zapisu usprawnionego opisu:', error);
            alert(error instanceof Error ? error.message : 'Nie udało się zapisać nowego opisu.');
            setDescriptionImproveTarget((current) => current ? { ...current, saving: false } : null);
        }
    };

    const auditActiveProperty = async (property: (typeof properties)[number]) => {
        setAuditingPropertyId(property.id);
        try {
            const now = new Date().toISOString();
            const publicUrl = `${window.location.origin}/oferty/${createSlug(property.title)}-${property.id}`;
            const propertyDraft: NonNullable<PropertyLead['propertyDraft']> = {
                title: property.title,
                price: property.price,
                location: property.location,
                beds: property.beds,
                baths: property.baths,
                sqft: property.sqft,
                type: property.type,
                status: property.status,
                description: property.description,
                features: property.features || [],
                image: property.image,
                images: property.images || [],
                featured: property.featured,
                agent: property.agent,
            };
            const pricePerM2 = property.sqft > 0 ? `${Math.round(property.price / property.sqft).toLocaleString('pl-PL')} zł/m²` : '';
            const currentData = {
                url: publicUrl,
                source: 'Strona Domiz Homes',
                sourceText: [property.title, `${property.price.toLocaleString('pl-PL')} zł`, property.location, `${property.sqft} m²`, `${property.beds} pokoje`, property.description, ...(property.features || [])].filter(Boolean).join('\n'),
                title: property.title,
                location: property.location,
                price: `${property.price.toLocaleString('pl-PL')} zł`,
                note: property.description,
                areaM2: property.sqft,
                rooms: property.beds,
                activePropertyId: property.id,
                propertyDraft,
                sourceDetails: { pricePerM2 },
                updatedAt: now,
            };
            const linkedLead = propertyLeads.find((item) => item.activePropertyId === property.id);
            let listingForAudit: PropertyLead;

            if (linkedLead) {
                const mergedSourceDetails = { ...(linkedLead.sourceDetails || {}), pricePerM2 };
                const mergedData = { ...currentData, sourceDetails: mergedSourceDetails };
                await updateDoc(doc(db, 'acquisitionListings', linkedLead.id), mergedData);
                listingForAudit = { ...linkedLead, ...mergedData };
                setPropertyLeads((previous) => previous.map((item) => item.id === linkedLead.id ? listingForAudit : item));
            } else {
                const initialHistory: AcquisitionStageHistory[] = [{
                    id: crypto.randomUUID(),
                    stage: 'acquired',
                    label: 'Umowa podpisana',
                    note: 'Oferta przekazana do audytu bezpośrednio z listy aktywnych ofert.',
                    createdAt: now,
                    author: user?.email || 'Domiz Homes',
                }];
                const reference = await addDoc(collection(db, 'acquisitionListings'), {
                    ...currentData,
                    stage: 'acquired' as AcquisitionStage,
                    stageHistory: initialHistory,
                    createdAt: now,
                });
                listingForAudit = { id: reference.id, ...currentData, stage: 'acquired', stageHistory: initialHistory, createdAt: now };
                setPropertyLeads((previous) => [listingForAudit, ...previous]);
            }

            const generated = await generateAiAudit(listingForAudit.id, '', listingForAudit, true);
            if (generated) {
                setPresentationLeadId(listingForAudit.id);
                setPresentationMode('audit');
                setActiveTab('presentation');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (error: any) {
            console.error('Błąd audytu aktywnej oferty:', error);
            alert(error?.message || 'Nie udało się rozpocząć audytu oferty.');
        } finally {
            setAuditingPropertyId(null);
        }
    };

    const generateShowcaseOffer = async (listingId: string) => {
        const listing = propertyLeads.find((item) => item.id === listingId);
        if (!listing?.auditData && !listing?.auditTranslations?.pl?.auditData) {
            alert('Najpierw wygeneruj audyt tej nieruchomości.');
            return false;
        }
        setGeneratingShowcaseId(listingId);
        try {
            const settingsSnapshot = await getDoc(doc(db, 'configs', 'seo'));
            const apiKey = settingsSnapshot.data()?.geminiApiKey?.trim();
            if (!apiKey) throw new Error('Najpierw dodaj klucz Google Gemini w zakładce „Ustawienia SEO & AI”.');

            const polishAudit = listing.auditTranslations?.pl?.auditData || listing.auditData;
            const englishAudit = listing.auditTranslations?.en?.auditData;
            const draft = listing.propertyDraft;
            const prompt = `Jesteś dyrektorem kreatywnym i copywriterem rynku nieruchomości w Domiz Homes. Na podstawie danych CRM oraz gotowego audytu przygotuj dwie kompletne wersje pokazowej oferty: polską w polu "pl" i angielską w polu "en". Materiał zostanie pokazany właścicielowi, aby zobaczył, jak profesjonalnie może wyglądać jego nieruchomość po wdrożeniu rekomendacji.

Zasady:
- korzystaj wyłącznie z potwierdzonych danych; nie dopisuj standardu, widoków, odległości, stanu prawnego ani wyposażenia, których nie ma w CRM;
- jeżeli fakt wymaga potwierdzenia, pomiń go w opisie zamiast zgadywać;
- tytuł ma być konkretny, elegancki i sprzedażowy, bez krzykliwych wielkich liter;
- subtitle ma w jednym zdaniu komunikować najważniejszą potwierdzoną korzyść;
- descriptionParagraphs ma zawierać 5–8 osobnych, krótkich akapitów gotowego opisu na stronę: najpierw najmocniejsza potwierdzona korzyść, następnie układ i standard, lokalizacja, profil kupującego oraz neutralne zaproszenie na prezentację;
- highlights: 5–8 krótkich, potwierdzonych atutów;
- photoPlaceholders: plan 6–10 zdjęć. Każdy element ma mieć krótki tytuł kadru oraz precyzyjny opis tego, co powinno znaleźć się na zdjęciu, z jakiej perspektywy i w jakim świetle. Plan ma uwzględniać rekomendacje audytu;
- placeholdery są instrukcją do przyszłej sesji, a nie informacją, że zdjęcie już istnieje;
- nie używaj określeń „apartament”, „luksusowy”, „prestiżowy”, „nowoczesny” ani innych sugestii wysokiego standardu, jeśli standard nie został wprost potwierdzony w danych;
- elementy wymienione w missingInformation są niepotwierdzone: nie wolno ich przedstawiać jako faktów;
- wersja "pl" ma być napisana naturalnym językiem polskim, a wersja "en" naturalnym, profesjonalnym językiem angielskim;
- obie wersje muszą zawierać dokładnie te same fakty, parametry, liczbę atutów i ten sam plan zdjęć w tej samej kolejności;
- kwoty i jednostki pozostaw w formacie źródłowym; nie przeliczaj waluty ani powierzchni;
- zwróć wyłącznie JSON zgodny ze schematem.

DANE NIERUCHOMOŚCI:
${JSON.stringify({ title: listing.title, location: listing.location, price: listing.price, areaM2: listing.areaM2 || draft?.sqft, rooms: listing.rooms || draft?.beds, bathrooms: draft?.baths, type: draft?.type, description: listing.note || draft?.description, features: draft?.features || [], sourceDetails: listing.sourceDetails || {}, sourceText: listing.sourceText?.slice(0, 12000) || '' })}

REKOMENDACJE AUDYTU PL:
${JSON.stringify({ verdict: polishAudit?.auditVerdict, strengths: polishAudit?.strengths, risks: polishAudit?.risks, quickWins: polishAudit?.quickWins, recommendedHeadline: polishAudit?.recommendedHeadline, buyerPersona: polishAudit?.buyerPersona, missingInformation: polishAudit?.missingInformation, photoPlan: polishAudit?.photoPlan, pricingRecommendation: polishAudit?.pricingRecommendation, differentiationStrategy: polishAudit?.differentiationStrategy, estimatedSalePrice: polishAudit?.estimatedSalePrice, estimatedSalePriceRange: polishAudit?.estimatedSalePriceRange, estimatedTimeToSell: polishAudit?.estimatedTimeToSell, estimateConfidence: polishAudit?.estimateConfidence, estimateRationale: polishAudit?.estimateRationale })}

REKOMENDACJE AUDYTU EN:
${JSON.stringify({ verdict: englishAudit?.auditVerdict, strengths: englishAudit?.strengths, risks: englishAudit?.risks, quickWins: englishAudit?.quickWins, recommendedHeadline: englishAudit?.recommendedHeadline, buyerPersona: englishAudit?.buyerPersona, missingInformation: englishAudit?.missingInformation, photoPlan: englishAudit?.photoPlan, pricingRecommendation: englishAudit?.pricingRecommendation, differentiationStrategy: englishAudit?.differentiationStrategy, estimatedSalePrice: englishAudit?.estimatedSalePrice, estimatedSalePriceRange: englishAudit?.estimatedSalePriceRange, estimatedTimeToSell: englishAudit?.estimatedTimeToSell, estimateConfidence: englishAudit?.estimateConfidence, estimateRationale: englishAudit?.estimateRationale })}`;
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { maxOutputTokens: 16384, temperature: 0.3, responseMimeType: 'application/json', responseSchema: { type: 'OBJECT', properties: { pl: SHOWCASE_OFFER_SCHEMA, en: SHOWCASE_OFFER_SCHEMA }, required: ['pl', 'en'] } },
                }),
            });
            if (!response.ok) {
                const details = await response.text();
                console.error('Gemini showcase offer error:', response.status, details);
                throw new Error(response.status === 429 ? 'Limit zapytań Gemini został chwilowo przekroczony. Spróbuj ponownie za moment.' : 'Nie udało się przygotować oferty pokazowej. Sprawdź klucz AI.');
            }
            const responseData = await response.json();
            const jsonText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!jsonText) throw new Error('Gemini zwrócił pustą odpowiedź. Spróbuj ponownie.');
            const generated = JSON.parse(jsonText);
            const generatedAt = new Date().toISOString();
            const showcaseOffer: ShowcaseOffer = { ...normalizeShowcaseOffer(generated.pl), generatedAt };
            const englishShowcaseOffer: ShowcaseOffer = { ...normalizeShowcaseOffer(generated.en), generatedAt };
            if (!showcaseOffer.description || showcaseOffer.photoPlaceholders.length < 6 || !englishShowcaseOffer.description || englishShowcaseOffer.photoPlaceholders.length < 6) throw new Error('Wygenerowany materiał jest niekompletny. Spróbuj ponownie.');
            const showcaseOfferTranslations: Record<AuditLanguage, ShowcaseOffer> = { pl: showcaseOffer, en: englishShowcaseOffer };
            const updates = { showcaseOffer, showcaseOfferTranslations, updatedAt: generatedAt };
            await updateDoc(doc(db, 'acquisitionListings', listingId), updates);
            setPropertyLeads((previous) => previous.map((item) => item.id === listingId ? { ...item, ...updates } : item));
            setViewingPropertyLead((item) => item?.id === listingId ? { ...item, ...updates } : item);
            return true;
        } catch (error: unknown) {
            console.error('Błąd generowania oferty pokazowej:', error);
            alert(error instanceof Error ? error.message : 'Nie udało się wygenerować oferty pokazowej.');
            return false;
        } finally {
            setGeneratingShowcaseId(null);
        }
    };

    const openShowcaseFromListing = async (item: PropertyLead) => {
        if (!item.showcaseOffer) {
            const generated = await generateShowcaseOffer(item.id);
            if (!generated) return;
        }
        setShowcasePreviewLeadId(item.id);
    };

    const showcasePreviewLead = showcasePreviewLeadId ? propertyLeads.find((item) => item.id === showcasePreviewLeadId) : undefined;

    const getAcquisitionPrompt = (stage: AcquisitionStage) => ({
        new: 'Sprawdź kompletność danych i ustal, czy nieruchomość pasuje do portfolio.',
        audit: 'Zapisz 3–5 konkretnych problemów ogłoszenia: zdjęcia, opis, cena, ekspozycja, grupa docelowa.',
        ready_to_call: 'Przygotuj merytoryczny audyt i hipotezę planu naprawczego. Nie oceniaj pośrednika.',
        contacted: 'Poznaj cel właściciela, historię sprzedaży, obecną umowę i termin możliwej współpracy.',
        consent_draft: 'Szkic oferty jest niewidoczny. Publikacja czeka na zgodę na stronę.',
        meeting: 'Pokaż audyt oraz plan: wizualizacje, pozycjonowanie, grupa docelowa, harmonogram i technologia.',
        proposal: 'Ustal zakres, warunki oraz datę decyzji. Zapisz następny krok i termin follow-upu.',
        acquired: 'Przenieś dane do aktywnej oferty i uruchom plan marketingowy.',
        nurture: 'Ustaw konkretny termin powrotu do rozmowy.',
        rejected: 'Zapisz powód zamknięcia — będzie źródłem wiedzy dla kolejnych audytów.',
    }[stage]);

    const deleteLead = async (leadId: string) => {
        if (!window.confirm('Czy na pewno chcesz usunąć to zgłoszenie?')) return;
        setDeletingLeadId(leadId);
        try {
            await deleteDoc(doc(db, 'inquiries', leadId));
            setInquiries((prev) => prev.filter((lead) => lead.id !== leadId));
            setLeadDrafts((prev) => {
                const next = { ...prev };
                delete next[leadId];
                return next;
            });
        } catch (error) {
            console.error('Błąd usuwania zgłoszenia:', error);
            alert('Nie udało się usunąć zgłoszenia.');
        } finally {
            setDeletingLeadId(null);
        }
    };

    const getPipelineStage = (status?: StoredLeadStatus): PipelineStage => status === 'closed' ? 'won' : status || 'new';
    const getStageMeta = (status?: StoredLeadStatus) => PIPELINE_STAGES.find((stage) => stage.id === getPipelineStage(status)) || PIPELINE_STAGES[0];

    const filteredInquiries = useMemo(() => {
        if (leadFilter === 'all') return inquiries;
        return inquiries.filter((lead) => getPipelineStage(lead.leadStatus) === leadFilter);
    }, [inquiries, leadFilter]);

    const leadStats = useMemo(() => {
        const stats: Record<PipelineStage | 'all', number> = { all: inquiries.length, new: 0, qualified: 0, contacted: 0, presentation: 0, negotiation: 0, won: 0, lost: 0 };
        inquiries.forEach((lead) => {
            const status = getPipelineStage(lead.leadStatus);
            stats[status] += 1;
        });
        return stats;
    }, [inquiries]);

    const formatDate = (value?: string) => {
        if (!value) return 'Brak daty';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return 'Brak daty';
        return date.toLocaleString('pl-PL');
    };

    const updateLeadDraft = (leadId: string, patch: Partial<LeadDraft>) => {
        setLeadDrafts((prev) => ({
            ...prev,
            [leadId]: {
                owner: prev[leadId]?.owner || '',
                followUpDate: prev[leadId]?.followUpDate || '',
                adminNote: prev[leadId]?.adminNote || '',
                ...patch,
            },
        }));
    };

    const saveLeadDetails = async (leadId: string) => {
        const draft = leadDrafts[leadId];
        if (!draft) return;
        setSavingLeadId(leadId);
        try {
            await updateDoc(doc(db, 'inquiries', leadId), {
                owner: draft.owner.trim(),
                followUpDate: draft.followUpDate || '',
                adminNote: draft.adminNote.trim(),
                updatedAt: new Date().toISOString(),
            });
            setInquiries((prev) =>
                prev.map((lead) =>
                    lead.id === leadId
                        ? { ...lead, owner: draft.owner.trim(), followUpDate: draft.followUpDate || '', adminNote: draft.adminNote.trim() }
                        : lead
                )
            );
        } catch (error) {
            console.error('Błąd zapisu notatki leada:', error);
            alert('Nie udało się zapisać notatki.');
        } finally {
            setSavingLeadId(null);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Loader2 className="animate-spin" size={32} />
            </div>
        );
    }

    return (
        <div className="container admin-dashboard" style={{ paddingTop: '120px', paddingBottom: '4rem', minHeight: '100vh' }}>
            <div className="admin-dashboard__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div><div className="admin-dashboard__eyebrow">DOMIZ HOMES</div><h1>Centrum pracy</h1><p>Oferty, pozyski i działania zespołu w jednym miejscu.</p></div>
                <div className="admin-dashboard__header-actions" style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className="btn-primary"
                        onClick={() => navigate('/admin/properties/new')}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Plus size={20} /> Dodaj ofertę
                    </button>
                    <button
                        onClick={() => void loadPropertyLeads()}
                        className="admin-btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                    >
                        <RefreshCw size={18} /> Odśwież pozyskania
                    </button>
                    <button
                        type="button"
                        className="admin-notifications__trigger"
                        aria-label={`Powiadomienia${unreadNotifications.length ? `: ${unreadNotifications.length} nowych` : ''}`}
                        aria-expanded={notificationsOpen}
                        onClick={() => setNotificationsOpen((open) => !open)}
                    >
                        {unreadNotifications.length ? <BellRing size={18} /> : <Bell size={18} />}<span>Powiadomienia</span>{unreadNotifications.length > 0 && <strong>{unreadNotifications.length > 99 ? '99+' : unreadNotifications.length}</strong>}
                    </button>
                    {pwaInstallPrompt && <button
                        onClick={() => void installPwa()}
                        className="admin-dashboard__install"
                        style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #a7f3d0', background: '#ecfdf5', color: '#047857', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
                    >
                        <Download size={18} /> Zainstaluj aplikację
                    </button>}
                    <button
                        onClick={() => logout().then(() => navigate('/admin/login'))}
                        className="admin-btn-danger"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                    >
                        <LogOut size={20} /> Wyloguj
                    </button>
                </div>
            </div>

            {notificationsOpen && <section className="admin-notifications" role="dialog" aria-label="Centrum powiadomień">
                <div className="admin-notifications__header"><div><div className="admin-dashboard__eyebrow">CENTRUM POWIADOMIEŃ</div><h2>Co wymaga uwagi</h2><p>{unreadNotifications.length ? `${unreadNotifications.length} nieprzeczytanych alertów` : 'Wszystko jest przejrzane'}</p></div><button type="button" aria-label="Zamknij powiadomienia" onClick={() => setNotificationsOpen(false)}>×</button></div>
                <div className="admin-notifications__device"><label>Alerty dla<select value={notificationCaretaker} onChange={(event) => { const caretaker = event.target.value as (typeof PROPERTY_CARETAKERS)[number]; setNotificationCaretaker(caretaker); localStorage.setItem(NOTIFICATION_CARETAKER_KEY, caretaker); }}>{PROPERTY_CARETAKERS.map((caretaker) => <option key={caretaker} value={caretaker}>{caretaker}</option>)}</select></label><button type="button" onClick={() => void enableBrowserNotifications()}>{browserNotificationsEnabled ? 'Odśwież alerty w tle' : 'Włącz alerty w tle'}</button></div>
                <div className="admin-notifications__actions">{unreadNotifications.length > 0 && <button type="button" onClick={() => saveReadNotificationIds([...readNotificationIds, ...crmNotifications.map((notification) => notification.id)])}>Oznacz wszystkie jako przeczytane</button>}</div>
                <div className="admin-notifications__list">{crmNotifications.length ? crmNotifications.slice(0, 30).map((notification) => { const unread = !readNotificationIds.includes(notification.id); return <button type="button" key={notification.id} className={unread ? 'is-unread' : ''} onClick={() => openCrmNotification(notification)}><span className={`admin-notifications__dot admin-notifications__dot--${notification.type}`} /><span><strong>{notification.title}</strong><span>{notification.body}</span><small>{[notification.assignee && `Opiekun: ${notification.assignee}`, notification.date && new Date(`${notification.date}T12:00:00`).toLocaleDateString('pl-PL')].filter(Boolean).join(' · ')}</small></span></button>; }) : <div className="admin-notifications__empty"><Bell size={24} /><strong>Brak powiadomień</strong><span>Nowe zadania, audyty i terminy pojawią się tutaj automatycznie.</span></div>}</div>
            </section>}

            {isNewLeadOpen && (
                <div role="dialog" aria-modal="true" aria-labelledby="new-lead-title" style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <form onSubmit={createLead} style={{ width: 'min(680px, 100%)', maxHeight: 'calc(100vh - 2rem)', overflowY: 'auto', background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 24px 60px rgba(15,23,42,0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                            <div><h2 id="new-lead-title" style={{ margin: 0 }}>Nowy lead</h2><p style={{ margin: '0.35rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Dodaj kontakt bezpośrednio do pipeline’u sprzedaży.</p></div>
                            <button type="button" onClick={() => { setIsNewLeadOpen(false); setNewLead(EMPTY_NEW_LEAD); }} aria-label="Zamknij" style={{ border: 0, background: 'transparent', color: 'var(--color-text-muted)', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>Klient / firma *<input required value={newLead.name} onChange={(e) => setNewLead((draft) => ({ ...draft, name: e.target.value }))} placeholder="np. Anna Kowalska" style={{ padding: '0.6rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem' }} /></label>
                            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>Źródło<input value={newLead.source} onChange={(e) => setNewLead((draft) => ({ ...draft, source: e.target.value }))} placeholder="np. polecenie, portal" style={{ padding: '0.6rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem' }} /></label>
                            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>Telefon<input type="tel" value={newLead.phone} onChange={(e) => setNewLead((draft) => ({ ...draft, phone: e.target.value }))} placeholder="np. 500 000 000" style={{ padding: '0.6rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem' }} /></label>
                            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>E-mail<input type="email" value={newLead.email} onChange={(e) => setNewLead((draft) => ({ ...draft, email: e.target.value }))} placeholder="anna@example.com" style={{ padding: '0.6rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem' }} /></label>
                            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>Etap pipeline’u<select value={newLead.leadStatus} onChange={(e) => setNewLead((draft) => ({ ...draft, leadStatus: e.target.value as PipelineStage }))} style={{ padding: '0.6rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem', background: 'white' }}>{PIPELINE_STAGES.map((stage) => <option key={stage.id} value={stage.id}>{stage.label}</option>)}</select></label>
                            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>Opiekun<input value={newLead.owner} onChange={(e) => setNewLead((draft) => ({ ...draft, owner: e.target.value }))} placeholder="np. Tomasz" style={{ padding: '0.6rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem' }} /></label>
                            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>Termin follow-upu<input type="date" value={newLead.followUpDate} onChange={(e) => setNewLead((draft) => ({ ...draft, followUpDate: e.target.value }))} style={{ padding: '0.6rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem' }} /></label>
                        </div>
                        <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600, marginTop: '0.85rem' }}>Notatka / potrzeba klienta<textarea rows={4} value={newLead.message} onChange={(e) => setNewLead((draft) => ({ ...draft, message: e.target.value }))} placeholder="Czego szuka klient? Jakie są kolejne kroki?" style={{ padding: '0.6rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem', resize: 'vertical' }} /></label>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '1.25rem' }}>
                            <button type="button" onClick={() => { setIsNewLeadOpen(false); setNewLead(EMPTY_NEW_LEAD); }} style={{ padding: '0.65rem 1rem', borderRadius: '0.45rem', border: '1px solid var(--color-border)', background: 'white', cursor: 'pointer' }}>Anuluj</button>
                            <button type="submit" disabled={creatingLead} className="btn-primary" style={{ opacity: creatingLead ? 0.65 : 1 }}>{creatingLead ? 'Dodawanie...' : 'Dodaj do pipeline’u'}</button>
                        </div>
                    </form>
                </div>
            )}

            <AdminTabBar
                activeTab={activeTab}
                presentationMode={presentationMode}
                counts={{ offers: properties.length, leads: inquiries.length, acquisition: propertyLeads.length, proposals: propertyLeads.filter((item) => Boolean(item.generatedProposal)).length, agreements: propertyLeads.filter((item) => Boolean(item.generatedAgreement)).length }}
                ownerLeadCount={ownerLeadCount}
                moreOpen={moreTabsOpen}
                onToggleMore={() => setMoreTabsOpen((open) => !open)}
                onTab={(tab) => { setMoreTabsOpen(false); setActiveTab(tab); }}
                onPresentation={(mode) => { setMoreTabsOpen(false); setPresentationMode(mode); setActiveTab('presentation'); }}
            />

            {activeTab === 'dashboard' && (() => {
                const total = propertyLeads.length;
                const acquired = propertyLeads.filter((item) => item.stage === 'acquired').length;
                const audited = propertyLeads.filter((item) => Boolean(item.auditSummary)).length;
                const ready = callQueue.filter((row) => row.kind === 'call').length;
                const today = new Date().toISOString().slice(0, 10);
                const overdueTasks = propertyLeads.flatMap((item) => (item.tasks || []).filter((task) => task.status === 'open' && task.dueDate < today).map((task) => ({ item, task })));
                const todayTasks = propertyLeads.flatMap((item) => (item.tasks || []).filter((task) => task.status === 'open' && task.dueDate === today).map((task) => ({ item, task })));
                const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
                const recentActivities = propertyLeads.flatMap((item) => (item.activities || []).filter((activity) => new Date(activity.createdAt).getTime() >= sevenDaysAgo));
                const ownerSummary = Object.entries(propertyLeads.reduce<Record<string, { total: number; ready: number; acquired: number; overdue: number }>>((summary, item) => { const owner = item.assignee?.trim() || 'Bez opiekuna'; const current = summary[owner] || { total: 0, ready: 0, acquired: 0, overdue: 0 }; current.total += 1; current.ready += item.stage === 'ready_to_call' ? 1 : 0; current.acquired += item.stage === 'acquired' ? 1 : 0; current.overdue += (item.tasks || []).filter((task) => task.status === 'open' && task.dueDate < today).length; summary[owner] = current; return summary; }, {})).sort(([, a], [, b]) => b.total - a.total);
                const metrics = [['Wszystkie pozyski', total, '#1d4ed8', '#eff6ff'], ['Audyty wykonane', audited, '#6d28d9', '#f5f3ff'], ['Do telefonu', ready, '#b45309', '#fffbeb'], ['Aktywne oferty', acquired, '#047857', '#ecfdf5'], ['Konwersja', total ? `${Math.round((acquired / total) * 100)}%` : '0%', '#0f766e', '#f0fdfa'], ['Zadania po terminie', overdueTasks.length, '#b91c1c', '#fef2f2'], ...ACQUISITION_STAGES.map((stage) => [stage.label, `${propertyLeads.filter((item) => (item.stage || 'new') === stage.id).length}${total ? ` · ${Math.round((propertyLeads.filter((item) => (item.stage || 'new') === stage.id).length / total) * 100)}%` : ''}`, stage.color, stage.background])];
                return <div className="glass-panel" style={{ padding: '1.25rem' }}><CallQueuePanel rows={callQueue} onOpenCall={openCallFromQueue} /><div><h2 style={{ margin: 0 }}>Wyniki pozyskiwania</h2><p style={{ margin: '0.35rem 0 1.25rem', color: 'var(--color-text-muted)' }}>Obraz pracy zespołu i najważniejszych kolejnych działań.</p></div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: '0.7rem' }}>{metrics.map(([label, value, color, background]) => <div key={label as string} style={{ padding: '0.85rem', borderRadius: '0.65rem', background: background as string, color: color as string }}><div style={{ fontSize: '0.78rem' }}>{label}</div><div style={{ fontWeight: 800, fontSize: '1.45rem', marginTop: '0.25rem' }}>{value}</div></div>)}</div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.85rem', marginTop: '1rem' }}><section style={{ padding: '1rem', border: '1px solid #fecaca', borderRadius: '0.65rem', background: '#fffafa' }}><h3 style={{ margin: 0, fontSize: '1rem', color: '#b91c1c' }}>Pilne zadania ({overdueTasks.length})</h3>{overdueTasks.length ? <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.75rem' }}>{overdueTasks.map(({ item, task }) => <button key={task.id} type="button" onClick={() => { setActiveTab('acquisition'); setViewingPropertyLead(item); }} style={{ textAlign: 'left', padding: '0.55rem', background: 'white', border: '1px solid #fecaca', borderRadius: '0.4rem', cursor: 'pointer' }}><strong>{task.title}</strong><div style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem', marginTop: '0.15rem' }}>{item.title} · termin: {task.dueDate}</div></button>)}</div> : <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>Brak zadań po terminie.</p>}</section><section style={{ padding: '1rem', border: '1px solid #bfdbfe', borderRadius: '0.65rem', background: '#f8fbff' }}><h3 style={{ margin: 0, fontSize: '1rem', color: '#1d4ed8' }}>Aktywność i dzisiejsze zadania</h3><div style={{ marginTop: '0.7rem', display: 'grid', gap: '0.35rem', fontSize: '0.9rem' }}><div><strong>{todayTasks.length}</strong> zadań na dziś</div><div><strong>{recentActivities.length}</strong> wpisów kontaktowych z ostatnich 7 dni</div><button type="button" onClick={() => setActiveTab('acquisition')} style={{ marginTop: '0.4rem', width: 'fit-content', padding: '0.4rem 0.55rem', border: '1px solid #bfdbfe', borderRadius: '0.4rem', color: '#1d4ed8', background: 'white', cursor: 'pointer', fontWeight: 700 }}>Otwórz pozyski</button></div></section></div><section style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '0.65rem', background: '#fff' }}><h3 style={{ margin: 0, fontSize: '1rem' }}>Portfele opiekunów</h3><p style={{ margin: '0.3rem 0 0.7rem', color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>Kliknij osobę, aby przejść do jej pozysków.</p>{ownerSummary.length ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.6rem' }}>{ownerSummary.map(([owner, summary]) => <button key={owner} type="button" onClick={() => { setAcquisitionSearch(owner === 'Bez opiekuna' ? '' : owner); setActiveTab('acquisition'); }} style={{ textAlign: 'left', padding: '0.7rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', background: '#f8fafc', cursor: 'pointer' }}><div style={{ fontWeight: 800 }}>{owner}</div><div style={{ marginTop: '0.3rem', color: '#475569', fontSize: '0.78rem' }}><strong>{summary.total}</strong> pozysków · {summary.ready} do kontaktu · {summary.acquired} pozyskanych</div>{summary.overdue > 0 && <div style={{ marginTop: '0.3rem', color: '#b91c1c', fontSize: '0.76rem', fontWeight: 700 }}>{summary.overdue} zadań po terminie</div>}</button>)}</div> : <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Przypisz opiekuna w edycji pozysku, aby zobaczyć podział pracy.</div>}</section></div>;
            })()}

            {activeTab === 'offers' && (
                <div className="glass-panel admin-offers" style={{ overflowX: 'auto' }}>
                    <div className="admin-offers__toolbar"><button type="button" aria-pressed={showOldImports} onClick={() => setShowOldImports((value) => !value)}>{showOldImports ? 'Ukryj stare importy' : `Pokaż stare importy (${oldImportCount})`}</button><span>Nieopublikowane importy z biura Bąkowski są schowane. Dokumenty zostają w bazie.</span></div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Zdjęcie</th>
                                <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Tytuł</th>
                                <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Cena</th>
                                <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Lokalizacja</th>
                                <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Status</th>
                                <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: '600', textAlign: 'right' }}>Akcje</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleOffers.map((property) => (
                                <tr key={property.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <img
                                            src={property.image}
                                            alt={property.title}
                                            style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '0.25rem' }}
                                        />
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: '500' }}>{property.title}</td>
                                    <td style={{ padding: '1rem', color: '#10b981', fontWeight: 'bold' }}>
                                        {property.price.toLocaleString('pl-PL')} zł
                                    </td>
                                    <td style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>{property.location}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <button
                                            type="button"
                                            className={`property-publication-toggle ${property.published === false ? 'is-draft' : 'is-published'}`}
                                            onClick={() => void togglePropertyPublication(property.id, property.published !== false)}
                                            disabled={updatingPropertyStatus === property.id}
                                            aria-label={`${property.title}: ${property.published === false ? 'wersja robocza. Kliknij, aby opublikować' : 'aktywna na stronie. Kliknij, aby ustawić jako wersję roboczą'}`}
                                            title={property.published === false ? 'Kliknij, aby opublikować na stronie' : 'Kliknij, aby ukryć na stronie'}
                                        >
                                            {updatingPropertyStatus === property.id
                                                ? <><Loader2 size={14} className="animate-spin" /> Zapisuję…</>
                                                : <><span aria-hidden="true" />{property.published === false ? 'Wersja robocza' : 'Aktywna na stronie'}</>}
                                        </button>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <button
                                                type="button"
                                                onClick={() => void improvePropertyDescription(property)}
                                                disabled={improvingDescriptionId === property.id}
                                                className="offer-improve-button"
                                                title="Usprawnij opis oferty według standardu Domiz Homes"
                                            >
                                                {improvingDescriptionId === property.id
                                                    ? <><Loader2 size={16} className="animate-spin" /> Usprawniam…</>
                                                    : <><FileText size={16} /> Usprawnij opis</>}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => void auditActiveProperty(property)}
                                                disabled={auditingPropertyId === property.id}
                                                className="offer-audit-button"
                                                title="Przeprowadź audyt aktualnej oferty"
                                            >
                                                {auditingPropertyId === property.id
                                                    ? <><Loader2 size={16} className="animate-spin" /> Audytuję…</>
                                                    : <><Sparkles size={16} /> Przeprowadź audyt</>}
                                            </button>
                                            <button
                                                type="button"
                                                className="offer-video-button"
                                                onClick={() => { setVideoStudioPropertyId(property.id); setActiveTab('videos'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                title="Przygotuj film promocyjny w HeyGen"
                                            >
                                                Przygotuj film
                                            </button>
                                            <button
                                                onClick={() => navigate(`/admin/properties/${property.id}/edit`)}
                                                style={{
                                                    padding: '0.5rem',
                                                    borderRadius: '0.375rem',
                                                    border: '1px solid var(--color-border)',
                                                    background: 'white',
                                                    cursor: 'pointer',
                                                    color: '#3b82f6'
                                                }}
                                                title="Edytuj"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(property.id)}
                                                disabled={deleting === property.id}
                                                style={{
                                                    padding: '0.5rem',
                                                    borderRadius: '0.375rem',
                                                    border: '1px solid #fee2e2',
                                                    background: '#fef2f2',
                                                    cursor: 'pointer',
                                                    color: '#dc2626',
                                                    opacity: deleting === property.id ? 0.5 : 1
                                                }}
                                                title="Usuń"
                                            >
                                                {deleting === property.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {properties.length === 0 && (
                        <div className="admin-empty"><strong>Brak ofert</strong><span>Dodaj pierwszą nieruchomość, gdy będzie gotowa do opisania.</span></div>
                    )}
                </div>
            )}

            {descriptionImproveTarget && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="description-improve-modal"
                    onClick={(event) => {
                        if (event.target === event.currentTarget && !descriptionImproveTarget.saving) setDescriptionImproveTarget(null);
                    }}
                >
                    <section className="description-improve-modal__panel">
                        <div className="description-improve-modal__header">
                            <div>
                                <div className="description-improve-modal__eyebrow">Usprawnij opis</div>
                                <h2>{descriptionImproveTarget.property.title}</h2>
                                <p>{descriptionImproveTarget.property.location} · {descriptionImproveTarget.property.price.toLocaleString('pl-PL')} zł</p>
                            </div>
                            <button
                                type="button"
                                aria-label="Zamknij"
                                disabled={descriptionImproveTarget.saving}
                                onClick={() => setDescriptionImproveTarget(null)}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="description-improve-modal__grid">
                            <article>
                                <h3>Obecny opis (PL)</h3>
                                <div className="description-improve-modal__current">
                                    {descriptionImproveTarget.property.description?.trim() || 'Brak opisu'}
                                </div>
                            </article>
                            <article>
                                <h3>Nowy opis (PL)</h3>
                                <textarea
                                    rows={14}
                                    value={descriptionImproveTarget.description}
                                    disabled={descriptionImproveTarget.saving}
                                    onChange={(event) => setDescriptionImproveTarget((current) => current
                                        ? { ...current, description: event.target.value }
                                        : current)}
                                />
                            </article>
                            <article>
                                <h3>Obecny opis (EN)</h3>
                                <div className="description-improve-modal__current">
                                    {descriptionImproveTarget.property.descriptionEn?.trim() || 'Brak wersji angielskiej'}
                                </div>
                            </article>
                            <article>
                                <h3>Nowy opis (EN)</h3>
                                <textarea
                                    rows={14}
                                    value={descriptionImproveTarget.descriptionEn}
                                    disabled={descriptionImproveTarget.saving}
                                    onChange={(event) => setDescriptionImproveTarget((current) => current
                                        ? { ...current, descriptionEn: event.target.value }
                                        : current)}
                                />
                            </article>
                        </div>

                        <div className="description-improve-modal__actions">
                            <button
                                type="button"
                                disabled={descriptionImproveTarget.saving}
                                onClick={() => void improvePropertyDescription(descriptionImproveTarget.property)}
                            >
                                {improvingDescriptionId === descriptionImproveTarget.property.id
                                    ? <><Loader2 size={16} className="animate-spin" /> Generuję ponownie…</>
                                    : 'Wygeneruj ponownie'}
                            </button>
                            <div>
                                <button
                                    type="button"
                                    disabled={descriptionImproveTarget.saving}
                                    onClick={() => setDescriptionImproveTarget(null)}
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="button"
                                    className="btn-primary"
                                    disabled={descriptionImproveTarget.saving || !descriptionImproveTarget.description.trim() || !descriptionImproveTarget.descriptionEn.trim()}
                                    onClick={() => void applyImprovedDescription()}
                                >
                                    {descriptionImproveTarget.saving
                                        ? <><Loader2 size={16} className="animate-spin" /> Zapisuję…</>
                                        : 'Zapisz nowy opis'}
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {activeTab === 'leads' && (
                <div className="glass-panel acquisition-workspace" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(118px, 1fr))', gap: '0.65rem', marginBottom: '1rem' }}>
                        <div style={{ background: '#f8fafc', border: '1px solid var(--color-border)', borderRadius: '0.65rem', padding: '0.7rem' }}>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Wszystkie</div>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{leadStats.all}</div>
                        </div>
                        {PIPELINE_STAGES.map((stage) => (
                            <button key={stage.id} onClick={() => setLeadFilter(stage.id)} style={{ textAlign: 'left', background: stage.background, border: `1px solid ${stage.border}`, borderRadius: '0.65rem', padding: '0.7rem', cursor: 'pointer' }}>
                                <div style={{ color: stage.color, fontSize: '0.75rem' }}>{stage.label}</div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: stage.color }}>{leadStats[stage.id]}</div>
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Zgłoszenia i pipeline sprzedaży</h2>
                            <button onClick={() => setIsNewLeadOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.7rem', borderRadius: '0.45rem', border: '1px solid #2563eb', background: '#eff6ff', color: '#1d4ed8', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}><Plus size={16} /> Dodaj leada</button>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button onClick={() => setLeadView('board')} title="Widok pipeline'u" style={{ padding: '0.5rem', borderRadius: '0.5rem', border: leadView === 'board' ? '1px solid #2563eb' : '1px solid var(--color-border)', background: leadView === 'board' ? '#eff6ff' : 'white', color: '#1d4ed8', cursor: 'pointer' }}><LayoutDashboard size={18} /></button>
                            <button onClick={() => setLeadView('list')} title="Widok szczegółów" style={{ padding: '0.5rem', borderRadius: '0.5rem', border: leadView === 'list' ? '1px solid #2563eb' : '1px solid var(--color-border)', background: leadView === 'list' ? '#eff6ff' : 'white', color: '#1d4ed8', cursor: 'pointer' }}><List size={18} /></button>
                            <select value={leadFilter} onChange={(e) => setLeadFilter(e.target.value as 'all' | PipelineStage)} style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}>
                                <option value="all">Wszystkie etapy</option>
                                {PIPELINE_STAGES.map((stage) => <option key={stage.id} value={stage.id}>{stage.label}</option>)}
                            </select>
                        </div>
                    </div>

                    {inquiriesLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                            <Loader2 className="animate-spin" />
                        </div>
                    ) : filteredInquiries.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                            Brak leadów dla wybranego filtra.
                        </div>
                    ) : leadView === 'board' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(230px, 1fr))', gap: '0.8rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                            {PIPELINE_STAGES.map((stage) => {
                                const stageLeads = filteredInquiries.filter((lead) => getPipelineStage(lead.leadStatus) === stage.id);
                                return (
                                    <section key={stage.id} style={{ background: stage.background, border: `1px solid ${stage.border}`, borderRadius: '0.75rem', padding: '0.65rem', minHeight: '240px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: stage.color, fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.65rem' }}>
                                            <span>{stage.label}</span><span>{stageLeads.length}</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                            {stageLeads.map((lead) => (
                                                <article key={lead.id} style={{ background: 'white', border: '1px solid rgba(15,23,42,0.08)', boxShadow: '0 1px 2px rgba(15,23,42,0.05)', borderRadius: '0.6rem', padding: '0.7rem' }}>
                                                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-main)' }}>{lead.name || lead.payload?.title || 'Lead bez nazwy'}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{lead.source || 'Nieznane źródło'} · {formatDate(lead.createdAt)}</div>
                                                    {lead.type === 'client_cooperation_selection' && (
                                                        <div style={{ marginTop: '0.55rem', padding: '0.55rem', borderRadius: '0.45rem', background: '#ecfdf5', color: '#065f46', fontSize: '0.78rem', lineHeight: 1.45 }}>
                                                            <strong>Wybrany wariant: {lead.payload?.packageName || 'brak danych'}</strong>
                                                            {lead.payload?.services?.length ? <div style={{ marginTop: '0.3rem' }}>Zakres: {lead.payload.services.join(' · ')}</div> : null}
                                                        </div>
                                                    )}
                                                    {lead.owner && <div style={{ fontSize: '0.77rem', marginTop: '0.5rem', color: 'var(--color-text-secondary)' }}>Opiekun: {lead.owner}</div>}
                                                    {lead.followUpDate && <div style={{ fontSize: '0.77rem', marginTop: '0.2rem', color: 'var(--color-text-secondary)' }}>Follow-up: {lead.followUpDate}</div>}
                                                    <select value={stage.id} disabled={updatingLeadId === lead.id} onChange={(e) => void setLeadStatus(lead.id, e.target.value as PipelineStage)} style={{ width: '100%', marginTop: '0.65rem', padding: '0.42rem', borderRadius: '0.4rem', border: '1px solid var(--color-border)', background: 'white', fontSize: '0.78rem' }}>
                                                        {PIPELINE_STAGES.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                                                    </select>
                                                </article>
                                            ))}
                                            {stageLeads.length === 0 && <div style={{ fontSize: '0.78rem', color: stage.color, opacity: 0.75, padding: '0.5rem 0' }}>Brak leadów</div>}
                                        </div>
                                    </section>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                            {filteredInquiries.map((lead) => (
                                <div key={lead.id} style={{ border: '1px solid var(--color-border)', borderRadius: '0.75rem', padding: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                <div style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>
                                                    {lead.name || lead.payload?.title || 'Lead bez nazwy'}
                                                </div>
                                                <span style={{
                                                    padding: '0.15rem 0.5rem',
                                                    borderRadius: '9999px',
                                                    border: `1px solid ${getStageMeta(lead.leadStatus).border}`,
                                                    background: getStageMeta(lead.leadStatus).background,
                                                    color: getStageMeta(lead.leadStatus).color,
                                                    fontSize: '0.72rem',
                                                    fontWeight: 700,
                                                }}>
                                                    {getStageMeta(lead.leadStatus).label}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                                Źródło: {lead.source || 'nieznane'} • Typ: {lead.type || 'nieznany'} • {formatDate(lead.createdAt)}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <select
                                                value={getPipelineStage(lead.leadStatus)}
                                                disabled={updatingLeadId === lead.id}
                                                onChange={(e) => void setLeadStatus(lead.id, e.target.value as PipelineStage)}
                                                style={{ padding: '0.45rem 0.6rem', borderRadius: '0.45rem', border: '1px solid var(--color-border)' }}
                                            >
                                                {PIPELINE_STAGES.map((stage) => <option key={stage.id} value={stage.id}>{stage.label}</option>)}
                                            </select>
                                            <button
                                                onClick={() => void deleteLead(lead.id)}
                                                disabled={deletingLeadId === lead.id}
                                                style={{
                                                    padding: '0.45rem',
                                                    borderRadius: '0.45rem',
                                                    border: '1px solid #fee2e2',
                                                    background: '#fef2f2',
                                                    color: '#dc2626',
                                                    cursor: 'pointer',
                                                    opacity: deletingLeadId === lead.id ? 0.5 : 1,
                                                }}
                                                title="Usuń zgłoszenie"
                                            >
                                                {deletingLeadId === lead.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.9rem' }}>
                                        {lead.phone && (
                                            <a href={`tel:${lead.phone}`} style={{ textDecoration: 'none', color: '#047857', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <Phone size={15} /> {lead.phone}
                                            </a>
                                        )}
                                        {lead.email && (
                                            <a href={`mailto:${lead.email}`} style={{ textDecoration: 'none', color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <Mail size={15} /> {lead.email}
                                            </a>
                                        )}
                                        {lead.payload?.location && (
                                            <span style={{ color: 'var(--color-text-secondary)' }}>Lokalizacja: {lead.payload.location}</span>
                                        )}
                                    </div>

                                    {lead.type === 'client_cooperation_selection' && (
                                        <section style={{ marginTop: '0.75rem', padding: '1rem', borderRadius: '0.65rem', border: '1px solid #86efac', background: '#f0fdf4' }}>
                                            <div style={{ color: '#047857', fontWeight: 800, fontSize: '0.78rem', letterSpacing: '0.06em' }}>WYBÓR Z PANELU KLIENTA</div>
                                            <div style={{ marginTop: '0.45rem', color: '#064e3b' }}><strong>Wariant współpracy:</strong> {lead.payload?.packageName || 'brak zapisanej nazwy wariantu'}</div>
                                            <div style={{ marginTop: '0.65rem', color: '#064e3b' }}><strong>Wybrane działania:</strong></div>
                                            {lead.payload?.services?.length ? (
                                                <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.2rem', color: '#065f46', display: 'grid', gap: '0.25rem' }}>
                                                    {lead.payload.services.map((service) => <li key={service}>{service}</li>)}
                                                </ul>
                                            ) : <div style={{ marginTop: '0.35rem', color: '#64748b' }}>Klient nie wybrał dodatkowych działań.</div>}
                                        </section>
                                    )}

                                    {(lead.message || lead.payload?.title) && (
                                        <div style={{ marginTop: '0.75rem', background: 'var(--color-bg-light)', borderRadius: '0.5rem', padding: '0.75rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                                                <MessageSquare size={14} /> Szczegóły
                                            </div>
                                            <div style={{ color: 'var(--color-text-main)', fontSize: '0.92rem', lineHeight: 1.5 }}>
                                                {lead.message || `Zgłoszenie sprzedaży: ${lead.payload?.title || 'bez tytułu oferty'}`}
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.6rem' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Opiekun</label>
                                                <input
                                                    value={leadDrafts[lead.id]?.owner || ''}
                                                    onChange={(e) => updateLeadDraft(lead.id, { owner: e.target.value })}
                                                    placeholder="np. Tomasz"
                                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.45rem', border: '1px solid var(--color-border)' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Follow-up</label>
                                                <input
                                                    type="date"
                                                    value={leadDrafts[lead.id]?.followUpDate || ''}
                                                    onChange={(e) => updateLeadDraft(lead.id, { followUpDate: e.target.value })}
                                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.45rem', border: '1px solid var(--color-border)' }}
                                                />
                                            </div>
                                        </div>
                                        <div style={{ marginTop: '0.6rem' }}>
                                            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Notatka</label>
                                            <textarea
                                                value={leadDrafts[lead.id]?.adminNote || ''}
                                                onChange={(e) => updateLeadDraft(lead.id, { adminNote: e.target.value })}
                                                rows={3}
                                                placeholder="Co już zostało zrobione, co dalej?"
                                                style={{ width: '100%', padding: '0.55rem', borderRadius: '0.45rem', border: '1px solid var(--color-border)', resize: 'vertical' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.55rem' }}>
                                            <button
                                                onClick={() => void saveLeadDetails(lead.id)}
                                                disabled={savingLeadId === lead.id}
                                                style={{
                                                    padding: '0.45rem 0.85rem',
                                                    borderRadius: '0.45rem',
                                                    border: '1px solid #86efac',
                                                    background: '#f0fdf4',
                                                    color: '#166534',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    opacity: savingLeadId === lead.id ? 0.6 : 1,
                                                }}
                                            >
                                                {savingLeadId === lead.id ? 'Zapisywanie...' : 'Zapisz notatkę'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'acquisition' && (
                <div className="glass-panel acquisition-workspace" style={{ padding: '1.25rem' }}>
                    <style>{'[title="Skopiuj link"], [title="Obserwuj"] { display: none !important; }'}</style>
                    <div className="acquisition-workspace__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        <div className="acquisition-call-filter"><button type="button" aria-pressed={callTodayOnly} onClick={() => setCallTodayOnly((value) => !value)}>Dzwoń dziś ({callQueue.length})</button></div><CallQueuePanel rows={callQueue} onOpenCall={openCallFromQueue} /><div><div className="admin-dashboard__eyebrow">PIPELINE POZYSKANIA</div><h2 style={{ margin: 0, fontSize: '1.2rem' }}>Pozyskiwanie ofert</h2><p style={{ margin: '0.35rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Potencjalne nieruchomości z Otodom, OLX i Facebooka — od analizy ogłoszenia do pozyskania umowy.</p><div className="acquisition-source-filter"><span>Źródło</span><div role="group" aria-label="Źródło pozysku">{['all', ...acquisitionSourceOptions].map((source) => <button key={source} type="button" aria-pressed={acquisitionSourceFilter === source} onClick={() => setAcquisitionSourceFilter(source)}>{source === 'all' ? 'Wszystkie' : source}</button>)}</div></div></div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}><div style={{ display: 'flex', padding: '0.2rem', border: '1px solid var(--color-border)', borderRadius: '0.55rem', background: 'white' }}><button type="button" className={acquisitionView === 'list' ? 'admin-segment is-on' : 'admin-segment'} onClick={() => setAcquisitionView('list')}>Lista</button><button type="button" className={acquisitionView === 'board' ? 'admin-segment is-on' : 'admin-segment'} onClick={() => setAcquisitionView('board')}>Proces</button></div><button type="button" onClick={exportAcquisitionsCsv} disabled={!filteredPropertyLeads.length} style={{ padding: '0.5rem 0.65rem', border: '1px solid #bfdbfe', borderRadius: '0.5rem', background: 'white', color: '#1d4ed8', cursor: filteredPropertyLeads.length ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: '0.8rem', opacity: filteredPropertyLeads.length ? 1 : 0.5 }}>Eksport CSV</button><button onClick={() => setIsSourceImportOpen(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Plus size={18} /> Dodaj nowy pozysk</button></div>
                    </div>
                    <div className="acquisition-toolbar" style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '1rem' }}><input aria-label="Szukaj pozysków" value={acquisitionSearch} onChange={(event) => setAcquisitionSearch(event.target.value)} placeholder="Szukaj po tytule, adresie lub cenie..." style={{ flex: '1 1 300px', padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem' }} /><button type="button" aria-pressed={privateOnly} onClick={() => setPrivateOnly((current) => !current)} style={{ padding: '0.65rem 0.8rem', borderRadius: '0.45rem', border: privateOnly ? '1px solid #047857' : '1px solid var(--color-border)', background: privateOnly ? '#ecfdf5' : 'white', color: privateOnly ? '#047857' : 'var(--color-text-main)', cursor: 'pointer', fontWeight: 700 }}>Tylko prywatne</button><button type="button" aria-pressed={attentionOnly} onClick={() => setAttentionOnly((current) => !current)} style={{ padding: '0.65rem 0.8rem', borderRadius: '0.45rem', border: attentionOnly ? '1px solid #b91c1c' : '1px solid var(--color-border)', background: attentionOnly ? '#fef2f2' : 'white', color: attentionOnly ? '#b91c1c' : 'var(--color-text-main)', cursor: 'pointer', fontWeight: 700 }}>Wymaga działania</button><button type="button" aria-pressed={incompleteOnly} onClick={() => setIncompleteOnly((current) => !current)} style={{ padding: '0.65rem 0.8rem', borderRadius: '0.45rem', border: incompleteOnly ? '1px solid #b45309' : '1px solid var(--color-border)', background: incompleteOnly ? '#fffbeb' : 'white', color: incompleteOnly ? '#b45309' : 'var(--color-text-main)', cursor: 'pointer', fontWeight: 700 }}>Braki danych</button><select aria-label="Filtr opiekuna" value={acquisitionAssigneeFilter} onChange={(event) => setAcquisitionAssigneeFilter(event.target.value as typeof acquisitionAssigneeFilter)} style={{ padding: '0.65rem 0.7rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem', background: 'white', color: 'var(--color-text-main)', cursor: 'pointer' }}><option value="all">Wszyscy opiekunowie</option><option value="unassigned">Bez opiekuna</option>{PROPERTY_CARETAKERS.map((caretaker) => <option key={caretaker} value={caretaker}>{caretaker}</option>)}</select><select aria-label="Sortowanie pozysków" value={acquisitionSort} onChange={(event) => setAcquisitionSort(event.target.value as typeof acquisitionSort)} style={{ padding: '0.65rem 0.7rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem', background: 'white', color: 'var(--color-text-main)', cursor: 'pointer' }}><option value="newest">Najnowsze</option><option value="deadline">Najbliższy termin</option><option value="price_desc">Cena: malejąco</option><option value="price_asc">Cena: rosnąco</option></select></div>
                    <div className="acquisition-stage-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.65rem', marginBottom: '1rem' }}>
                        {ACQUISITION_STAGES.map((stage) => {
                            const active = acquisitionFilter === stage.id;
                            return <button key={stage.id} type="button" aria-pressed={active} onClick={() => setAcquisitionFilter((current) => current === stage.id ? 'all' : stage.id)} style={{ padding: '0.65rem', borderRadius: '0.55rem', background: stage.background, color: stage.color, border: active ? `2px solid ${stage.color}` : '1px solid transparent', boxShadow: active ? `0 0 0 2px ${stage.background}` : 'none', cursor: 'pointer', textAlign: 'left' }}><div style={{ fontSize: '0.78rem' }}>{stage.label}</div><div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{propertyLeads.filter((item) => (item.stage || 'new') === stage.id).length}</div></button>;
                        })}
                    </div>
                    <div className="acquisition-results-summary" aria-live="polite"><span>Wyświetlam <strong>{filteredPropertyLeads.length}</strong> z {propertyLeads.length} pozysków{acquisitionFilter !== 'all' ? <> · <strong>{ACQUISITION_STAGES.find((stage) => stage.id === acquisitionFilter)?.label}</strong></> : null}</span>{hasActiveAcquisitionFilters && <button type="button" onClick={clearAcquisitionFilters}>Wyczyść filtry</button>}</div>
                    {!propertyLeadsLoading && propertyLeads.length > 0 && filteredPropertyLeads.length === 0 && acquisitionView === 'list' && <div className="acquisition-empty acquisition-empty--filtered"><strong>Brak pasujących pozysków</strong><span>Zmień kryteria albo użyj przycisku „Wyczyść filtry” powyżej.</span></div>}
                    {(() => { const openTasks = propertyLeads.flatMap((item) => (item.tasks || []).filter((task) => task.status === 'open').map((task) => ({ item, task }))).sort((a, b) => a.task.dueDate.localeCompare(b.task.dueDate)).slice(0, 5); return openTasks.length ? <div style={{ marginBottom: '1rem', padding: '0.85rem', borderRadius: '0.65rem', border: '1px solid #bfdbfe', background: '#eff6ff' }}><div style={{ color: '#1d4ed8', fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.55rem' }}>Najbliższe zadania</div><div style={{ display: 'grid', gap: '0.4rem' }}>{openTasks.map(({ item, task }) => <button key={task.id} type="button" onClick={() => setViewingPropertyLead(item)} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '0.45rem 0.55rem', border: '1px solid #dbeafe', background: 'white', borderRadius: '0.4rem', cursor: 'pointer', textAlign: 'left' }}><span><strong>{task.title}</strong><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}> — {item.title}</span></span><span style={{ color: '#1d4ed8', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{task.dueDate}</span></button>)}</div></div> : null; })()}
                    {(() => { const today = new Date().toISOString().slice(0, 10); const awaitingDecisions = propertyLeads.filter((item) => item.proposal?.decisionDate && !item.proposalDecision).sort((a, b) => (a.proposal?.decisionDate || '').localeCompare(b.proposal?.decisionDate || '')).slice(0, 5); return awaitingDecisions.length ? <div style={{ marginBottom: '1rem', padding: '0.85rem', borderRadius: '0.65rem', border: '1px solid #fed7aa', background: '#fff7ed' }}><div style={{ color: '#9a3412', fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.55rem' }}>Oczekujące decyzje właścicieli</div><div style={{ display: 'grid', gap: '0.4rem' }}>{awaitingDecisions.map((item) => { const deadline = item.proposal?.decisionDate || ''; const overdue = deadline < today; return <button key={item.id} type="button" onClick={() => setViewingPropertyLead(item)} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '0.45rem 0.55rem', border: '1px solid #fed7aa', background: 'white', borderRadius: '0.4rem', cursor: 'pointer', textAlign: 'left' }}><span><strong>{item.title || 'Potencjalna oferta'}</strong><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}> — {item.proposal?.agreementType}</span></span><span style={{ color: overdue ? '#b91c1c' : '#9a3412', fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{overdue ? 'Po terminie: ' : 'Termin: '}{new Date(`${deadline}T12:00:00`).toLocaleDateString('pl-PL')}</span></button>; })}</div></div> : null; })()}
                    {acquisitionView === 'board' ? <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}><div style={{ display: 'flex', gap: '0.75rem', minWidth: `${ACQUISITION_STAGES.length * 230}px` }}>{ACQUISITION_STAGES.map((stage) => { const items = filteredPropertyLeads.filter((item) => (item.stage || 'new') === stage.id); return <section key={stage.id} style={{ width: 220, flex: '0 0 220px', padding: '0.65rem', borderRadius: '0.65rem', background: stage.background, border: `1px solid ${stage.color}33` }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', color: stage.color, fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.6rem' }}><span>{stage.label}</span><span>{items.length}</span></div><div style={{ display: 'grid', gap: '0.55rem' }}>{items.length ? items.map((item) => <button key={item.id} type="button" onClick={() => setViewingPropertyLead(item)} style={{ padding: '0.65rem', textAlign: 'left', border: '1px solid rgba(148,163,184,0.35)', borderRadius: '0.5rem', background: 'white', cursor: 'pointer', boxShadow: '0 1px 2px rgba(15,23,42,0.05)' }}><div style={{ fontWeight: 750, fontSize: '0.83rem', lineHeight: 1.35 }}>{item.title || 'Ogłoszenie'}</div><div style={{ marginTop: '0.35rem', color: '#475569', fontSize: '0.75rem' }}>{item.location || 'Brak lokalizacji'}</div><div style={{ marginTop: '0.35rem', color: '#0f172a', fontWeight: 700, fontSize: '0.8rem' }}>{item.price || 'Cena do uzupełnienia'}</div><div style={{ marginTop: '0.45rem', color: item.assignee ? '#4338ca' : '#94a3b8', fontSize: '0.72rem', fontWeight: 700 }}>Opiekun: {item.assignee || 'nieprzypisany'}</div>{item.proposal?.decisionDate && !item.proposalDecision && <div style={{ marginTop: '0.45rem', fontSize: '0.7rem', color: '#9a3412' }}>Decyzja: {new Date(`${item.proposal.decisionDate}T12:00:00`).toLocaleDateString('pl-PL')}</div>}</button>) : <div style={{ padding: '0.7rem 0.2rem', color: '#64748b', fontSize: '0.76rem' }}>Brak ofert</div>}</div></section>; })}</div></div> : propertyLeadsLoading ? <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Loader2 className="animate-spin" /></div> : propertyLeads.length === 0 ? <div className="acquisition-empty" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}><strong>Brak zapisanych pozysków</strong><span>Dodaj link i treść ogłoszenia z Otodom, OLX lub Facebooka.</span><button type="button" className="btn-primary" onClick={() => setIsSourceImportOpen(true)}><Plus size={17} /> Dodaj pierwszy pozysk</button></div> : (
                        <div className="acquisition-list" style={{ display: 'grid', gap: '0.85rem', maxWidth: '980px', margin: '0 auto' }}>
                            {filteredPropertyLeads.map((item) => {
                                const stage = ACQUISITION_STAGES.find((value) => value.id === (item.stage || 'new')) || ACQUISITION_STAGES[0];
                                const image = item.propertyDraft?.image || item.propertyDraft?.images?.[0];
                                const floor = item.sourceDetails?.floor;
                                const listingSource = getListingSource(item.url) || item.source || 'Ogłoszenie';
                                const areaForPrice = item.areaM2 || item.propertyDraft?.sqft || 0;
                                const numericPrice = item.propertyDraft?.price || Number((item.price || '').replace(/[^\d]/g, '')) || 0;
                                const pricePerM2 = item.sourceDetails?.pricePerM2 || (numericPrice && areaForPrice ? `${Math.round(numericPrice / areaForPrice).toLocaleString('pl-PL')} zł/m²` : '');
                                const missingData = [!item.ownerPhone && 'telefon', !image && 'zdjęcie', !item.price && 'cena', (item.stage === 'audit' || item.stage === 'ready_to_call') && !item.auditSummary && 'audyt'].filter(Boolean) as string[];
                                return <article className="acquisition-card" key={item.id} style={{ display: 'grid', gridTemplateColumns: '270px minmax(0, 1fr)', overflow: 'hidden', border: '1px solid var(--color-border)', borderRadius: '0.85rem', background: 'white', boxShadow: '0 2px 5px rgba(15,23,42,0.06)' }}>
                                    <div className="acquisition-card__media" style={{ minHeight: '205px', background: '#e2e8f0', position: 'relative' }}>{image ? <img src={image} alt={item.title || 'Nieruchomość'} style={{ width: '100%', height: '100%', minHeight: '205px', objectFit: 'cover', display: 'block' }} /> : <div style={{ height: '100%', minHeight: '205px', display: 'grid', placeItems: 'center', color: '#64748b', fontSize: '0.85rem' }}>Brak zdjęcia</div>}<span style={{ position: 'absolute', left: '0.65rem', bottom: '0.65rem', padding: '0.25rem 0.45rem', borderRadius: '999px', background: 'rgba(15,23,42,0.72)', color: 'white', fontSize: '0.72rem' }}>{item.propertyDraft?.images?.length || 0} zdjęć</span></div>
                                    <div className="acquisition-card__content" style={{ padding: '0.9rem 1rem', minWidth: 0 }}>
                                        <div className="acquisition-card__top"><div><div className="acquisition-card__source">{listingSource}</div><div className="acquisition-card__price">{item.price || 'Cena do uzupełnienia'} <span>{pricePerM2 ? `· ${pricePerM2}` : ''}</span></div><div className="acquisition-card__title">{item.title || 'Ogłoszenie'}</div><div className="acquisition-card__location"><MapPin size={13} /> {item.location || 'Lokalizacja do uzupełnienia'}</div></div><button type="button" className="acquisition-card__note" onClick={() => { setNoteTarget(item); setNewAcquisitionNote(''); }}><MessageSquare size={14} /> Dodaj notatkę{item.notes?.length ? ` (${item.notes.length})` : ''}</button></div>
                                        {(item.rooms || item.areaM2 || floor) && <div className="acquisition-card__facts" style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', marginTop: '0.75rem', fontSize: '0.83rem', fontWeight: 700 }}>{item.rooms ? <span style={{ display: 'inline-flex', gap: '0.28rem', alignItems: 'center' }}><BedDouble size={15} /> {item.rooms} pok.</span> : null}{item.areaM2 ? <span style={{ display: 'inline-flex', gap: '0.28rem', alignItems: 'center' }}><Ruler size={15} /> {item.areaM2} m²</span> : null}{floor && <span style={{ display: 'inline-flex', gap: '0.28rem', alignItems: 'center' }}><Building2 size={15} /> Piętro {floor}</span>}</div>}
                                        <label className="acquisition-card__assignee"><span>Opiekun oferty</span><select aria-label={`Opiekun: ${item.title || 'pozysk'}`} value={item.assignee || ''} disabled={savingAssigneeId === item.id} onChange={(event) => void setPropertyLeadAssignee(item.id, event.target.value)}><option value="">Nieprzypisany</option>{PROPERTY_CARETAKERS.map((caretaker) => <option key={caretaker} value={caretaker}>{caretaker}</option>)}</select>{savingAssigneeId === item.id && <small>Zapisywanie…</small>}</label>
                                        <div className="acquisition-card__next-step" style={{ background: stage.background, color: stage.color }}><span>Następny krok</span>{getAcquisitionPrompt(item.stage || 'new')}</div>
                                        {missingData.length > 0 && <div className="acquisition-card__missing">Do uzupełnienia: {missingData.join(' · ')}</div>}
                                        <AcquisitionCallCard lead={item} consent={consentForLead(item, ownerConsentsById)} onSavePhone={(phone) => saveLeadPhone(item.id, phone)} onSaveResult={(input) => saveCallCardResult(item.id, input)} onPrepareConsent={() => prepareOwnerConsentLink(item.id)} />
                                        <div className="acquisition-card__footer">
                                            <div className="acquisition-card__actions">
                                                <button className="acquisition-card__primary-action" type="button" onClick={() => setViewingPropertyLead(item)}>Otwórz pozysk</button>
                                                {(item.stage === 'proposal' || item.generatedProposal || item.generatedAgreement) ? (
                                                    <button type="button" className="acquisition-card__stage-action" onClick={() => openProposalEditor(item)}>{item.proposal ? 'Edytuj warunki' : 'Przygotuj warunki'}</button>
                                                ) : item.auditSummary ? (
                                                    <button type="button" className="acquisition-card__stage-action" onClick={() => { setPresentationLeadId(item.id); setPresentationMode('audit'); setActiveTab('presentation'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Pokaż audyt</button>
                                                ) : (
                                                    <button type="button" className="acquisition-card__stage-action" onClick={() => void generateAiAudit(item.id)} disabled={generatingAuditId === item.id}>{generatingAuditId === item.id ? 'Generowanie…' : 'Generuj audyt'}</button>
                                                )}
                                            </div>
                                            <div className="acquisition-card__controls">
                                                <select aria-label={`Status: ${item.title || 'pozysk'}`} value={item.stage || 'new'} onChange={(event) => void setPropertyLeadStage(item.id, event.target.value as AcquisitionStage)}>{ACQUISITION_STAGES.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select>
                                                <details className="acquisition-card__more">
                                                    <summary aria-label={`Więcej działań: ${item.title || 'pozysk'}`}><MoreHorizontal size={17} /><span>Więcej</span></summary>
                                                    <div className="acquisition-card__menu">
                                                        <div className="acquisition-card__menu-label">OFERTA</div>
                                                        <button type="button" onClick={() => openPropertyLeadEditor(item)}><Edit size={15} /> Edytuj dane</button>
                                                        <button type="button" onClick={() => { setNoteTarget(item); setNewAcquisitionNote(''); }}><MessageSquare size={15} /> Dodaj notatkę</button>
                                                        <a href={item.url} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Otwórz {listingSource}</a>
                                                        {(item.stage === 'proposal' || item.generatedProposal || item.generatedAgreement) && <>
                                                            <div className="acquisition-card__menu-label">WSPÓŁPRACA</div>
                                                            <button type="button" onClick={() => openCooperationDocument(item, 'proposal')}><FileText size={15} /> {item.generatedProposal ? 'Otwórz proposal' : 'Generuj proposal'}</button>
                                                            <button type="button" onClick={() => openCooperationDocument(item, 'agreement')}><FileText size={15} /> {item.generatedAgreement ? 'Otwórz umowę' : 'Generuj umowę'}</button>
                                                        </>}
                                                        {item.auditSummary && <>
                                                            <div className="acquisition-card__menu-label">MARKETING I AUDYT</div>
                                                            {(item.stage === 'proposal' || item.generatedProposal || item.generatedAgreement) && <button type="button" onClick={() => { setPresentationLeadId(item.id); setPresentationMode('audit'); setActiveTab('presentation'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><Sparkles size={15} /> Pokaż audyt</button>}
                                                            <button type="button" onClick={() => void openShowcaseFromListing(item)} disabled={generatingShowcaseId === item.id}><Camera size={15} /> {generatingShowcaseId === item.id ? 'Tworzę ofertę…' : 'Oferta pokazowa'}</button>
                                                            <button type="button" onClick={() => void generateAiAudit(item.id)} disabled={generatingAuditId === item.id}><RefreshCw size={15} /> {generatingAuditId === item.id ? 'Generowanie…' : 'Wygeneruj ponownie audyt'}</button>
                                                        </>}
                                                        <div className="acquisition-card__menu-label">ZARZĄDZANIE</div>
                                                        <button type="button" className="is-danger" onClick={() => void deletePropertyLead(item.id)} disabled={deletingPropertyLead === item.id}><Trash2 size={15} /> {deletingPropertyLead === item.id ? 'Usuwanie…' : 'Usuń ogłoszenie'}</button>
                                                    </div>
                                                </details>
                                            </div>
                                        </div>
                                    </div>
                                </article>;
                            })}
                        </div>
                    )}

                    {viewingPropertyLead && (() => {
                        const item = viewingPropertyLead;
                        const listingSource = getListingSource(item.url) || item.source || 'ogłoszenie źródłowe';
                        const draft = item.propertyDraft;
                        const details = item.sourceDetails || {};
                        const rows = [
                            ['Cena za m²', details.pricePerM2], ['Ogrzewanie', details.heating], ['Piętro', details.floor], ['Czynsz', details.rent], ['Stan wykończenia', details.finishCondition], ['Rynek', details.market], ['Forma własności', details.ownership], ['Dostępne od', details.availableFrom], ['Ogłoszeniodawca', details.advertiserType], ['Winda', details.buildingElevator], ['Rodzaj zabudowy', details.buildingType], ['Okna', details.windows],
                        ].filter(([, value]) => Boolean(value));
                        const contactScript = [
                            `Dzień dobry${item.ownerName ? `, czy rozmawiam z ${item.ownerName}?` : ''} Nazywam się [imię] i dzwonię z Domiz Homes w sprawie ogłoszenia: „${item.title || 'Państwa nieruchomości'}”.`,
                            `Widzę, że oferta dotyczy lokalizacji ${item.location || 'wskazanej w ogłoszeniu'}${item.price ? ` i jest wystawiona za ${item.price}` : ''}. Czy ogłoszenie jest nadal aktualne?`,
                            item.auditSummary ? 'Przeanalizowaliśmy sposób prezentacji tej oferty i widzimy kilka konkretnych możliwości, aby lepiej dotrzeć do właściwych kupujących. Chętnie pokażemy je w krótkim, bezpłatnym audycie.' : 'Chcielibyśmy krótko pokazać, jak możemy lepiej zaprezentować nieruchomość i dotrzeć do właściwych kupujących.',
                            'Czy możemy umówić 15-minutową rozmowę lub spotkanie, podczas którego przejdziemy przez rekomendacje i plan sprzedaży?',
                            'Nie chcemy oceniać obecnej oferty ani osoby prowadzącej sprzedaż — zależy nam na konkretnych działaniach, które mogą zwiększyć jej skuteczność.',
                        ].join('\n\n');
                        const smsScript = `Dzień dobry${item.ownerName ? ` ${item.ownerName}` : ''}, tu [imię] z Domiz Homes. Dzwoniłem/am w sprawie ogłoszenia „${item.title || 'nieruchomości'}”. Przygotowaliśmy kilka konkretnych pomysłów na skuteczniejszą prezentację oferty. Czy możemy umówić krótką rozmowę w dogodnym terminie?`;
                        return <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 101, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(15,23,42,0.5)', overflowY: 'auto' }}>
                            <section style={{ width: 'min(820px, 100%)', margin: 'auto', background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 24px 60px rgba(15,23,42,0.25)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}><div><div style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', marginBottom: '0.35rem' }}>Podgląd potencjalnej oferty</div><h2 style={{ margin: 0 }}>{item.title || 'Ogłoszenie z Otodom'}</h2><div style={{ color: 'var(--color-text-secondary)', marginTop: '0.35rem' }}>{[item.location, item.price, item.areaM2 ? `${item.areaM2} m²` : '', item.rooms ? `${item.rooms} pok.` : ''].filter(Boolean).join(' · ')}</div></div><button type="button" aria-label="Zamknij" onClick={() => setViewingPropertyLead(null)} style={{ border: 0, background: 'transparent', fontSize: '1.5rem', cursor: 'pointer' }}>×</button></div>
                                <label className="acquisition-preview__assignee"><span>Opiekun oferty</span><select aria-label="Opiekun oferty" value={item.assignee || ''} disabled={savingAssigneeId === item.id} onChange={(event) => void setPropertyLeadAssignee(item.id, event.target.value)}><option value="">Nieprzypisany</option>{PROPERTY_CARETAKERS.map((caretaker) => <option key={caretaker} value={caretaker}>{caretaker}</option>)}</select>{savingAssigneeId === item.id && <small>Zapisywanie…</small>}</label>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem', padding: '0.75rem 0.85rem', border: '1px solid #bbf7d0', borderRadius: '0.6rem', background: '#f0fdf4' }}><div><div style={{ color: '#166534', fontSize: '0.73rem', fontWeight: 800, textTransform: 'uppercase' }}>Kontakt do właściciela</div><div style={{ marginTop: '0.15rem', fontWeight: 700 }}>{item.ownerName || 'Imię do uzupełnienia'}{item.ownerPhone && <span style={{ color: '#475569', fontWeight: 500 }}> · {item.ownerPhone}</span>}</div></div>{item.ownerPhone ? <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}><a href={`tel:${item.ownerPhone.replace(/\s/g, '')}`} style={{ padding: '0.4rem 0.55rem', border: '1px solid #86efac', borderRadius: '0.4rem', background: 'white', color: '#166534', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 700 }}>Zadzwoń</a><a href={`sms:${item.ownerPhone.replace(/\s/g, '')}`} style={{ padding: '0.4rem 0.55rem', border: '1px solid #86efac', borderRadius: '0.4rem', background: 'white', color: '#166534', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 700 }}>SMS</a><button type="button" onClick={() => void copyAcquisitionText(smsScript, 'SMS')} style={{ padding: '0.4rem 0.55rem', border: '1px solid #86efac', borderRadius: '0.4rem', background: 'white', color: '#166534', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>Kopiuj SMS</button></div> : <button type="button" onClick={() => { setViewingPropertyLead(null); openPropertyLeadEditor(item); }} style={{ padding: '0.4rem 0.55rem', border: '1px solid #86efac', borderRadius: '0.4rem', background: 'white', color: '#166534', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>Dodaj kontakt</button>}</div>
                                <AcquisitionCallCard lead={item} consent={consentForLead(item, ownerConsentsById)} onSavePhone={(phone) => saveLeadPhone(item.id, phone)} onSaveResult={(input) => saveCallCardResult(item.id, input)} onPrepareConsent={() => prepareOwnerConsentLink(item.id)} />
                                <button type="button" onClick={() => openCallOutcome(item)} style={{ marginTop: '0.65rem', padding: '0.45rem 0.6rem', border: '1px solid #86efac', borderRadius: '0.4rem', background: '#f0fdf4', color: '#166534', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>Zapisz wynik rozmowy</button>
                                {draft?.images?.length ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.65rem', marginTop: '1rem' }}>{draft.images.map((image, index) => <img key={image} src={image} alt={`Zdjęcie oferty ${index + 1}`} style={{ width: '100%', height: '130px', objectFit: 'cover', borderRadius: '0.5rem' }} />)}</div> : null}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: '0.7rem', marginTop: '1rem' }}>
                                    {[['Typ', draft?.type], ['Rodzaj oferty', draft?.status === 'wynajem' ? 'wynajem' : draft ? 'sprzedaż' : ''], ['Łazienki', draft?.baths ? String(draft.baths) : ''], ...rows].filter(([, value]) => Boolean(value)).map(([label, value]) => <div key={label} style={{ padding: '0.6rem', border: '1px solid var(--color-border)', borderRadius: '0.5rem' }}><div style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>{label}</div><div style={{ fontSize: '0.86rem', fontWeight: 600, marginTop: '0.15rem' }}>{value}</div></div>)}
                                </div>
                                {draft?.features?.length ? <div style={{ marginTop: '1rem' }}><div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>Udogodnienia</div><div>{draft.features.join(' · ')}</div></div> : null}
                                {item.note && <div style={{ marginTop: '1rem', whiteSpace: 'pre-wrap', lineHeight: 1.55 }}><div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>Opis</div>{item.note}</div>}
                                {item.auditSummary && <div style={{ marginTop: '1rem', padding: '0.9rem', borderRadius: '0.55rem', background: '#f5f3ff', border: '1px solid #ddd6fe', whiteSpace: 'pre-wrap', lineHeight: 1.55 }}><div style={{ fontSize: '0.8rem', color: '#6d28d9', fontWeight: 700, marginBottom: '0.35rem' }}>Audyt ogłoszenia</div>{item.auditSummary}</div>}
                                <AdvancedAuditPanel audit={item.auditData} versions={item.auditVersions} />
                                <div style={{ marginTop: '1rem', padding: '0.85rem', border: '1px solid #bbf7d0', borderRadius: '0.6rem', background: '#f6fef8' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}><div><strong>Skrypt pierwszego kontaktu</strong><div style={{ marginTop: '0.15rem', color: '#475569', fontSize: '0.76rem' }}>Punkt wyjścia do rozmowy — dopasowany do tej nieruchomości.</div></div><button type="button" onClick={() => void copyAcquisitionText(contactScript)} style={{ padding: '0.35rem 0.55rem', border: '1px solid #86efac', borderRadius: '0.4rem', background: 'white', color: '#166534', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 700 }}>Kopiuj skrypt</button></div><div style={{ marginTop: '0.7rem', padding: '0.65rem', borderRadius: '0.4rem', background: 'white', color: '#334155', fontSize: '0.84rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{contactScript}</div></div>
                                <button type="button" onClick={() => void addSuggestedTaskPlan(item)} style={{ marginTop: '0.75rem', padding: '0.45rem 0.6rem', border: '1px solid #93c5fd', borderRadius: '0.4rem', background: '#eff6ff', color: '#1d4ed8', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>+ Dodaj plan działań dla tego etapu</button>
                                <div style={{ marginTop: '1rem', padding: '0.85rem', border: '1px solid #e2e8f0', borderRadius: '0.6rem', background: '#f8fafc' }}><strong>Historia procesu</strong>{item.stageHistory?.length ? <div style={{ display: 'grid', gap: '0.45rem', marginTop: '0.65rem' }}>{item.stageHistory.slice().reverse().map((entry) => <div key={entry.id} style={{ display: 'grid', gridTemplateColumns: '10px 1fr', gap: '0.55rem', alignItems: 'start', fontSize: '0.82rem' }}><span style={{ width: 9, height: 9, marginTop: '0.28rem', borderRadius: '50%', background: ACQUISITION_STAGES.find((option) => option.id === entry.stage)?.color || '#64748b' }} /><div><strong>{entry.label}</strong>{entry.note && <span> — {entry.note}</span>}<div style={{ marginTop: '0.12rem', color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>{new Date(entry.createdAt).toLocaleString('pl-PL')} · {entry.author}</div></div></div>)}</div> : <div style={{ marginTop: '0.55rem', color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>Historia będzie zapisywana od kolejnej zmiany etapu.</div>}</div>
                                <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}><div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Notatki ({item.notes?.length || 0})</div><button type="button" onClick={() => { setNoteTarget(item); setNewAcquisitionNote(''); }} style={{ padding: '0.35rem 0.55rem', borderRadius: '0.4rem', border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#166534', cursor: 'pointer', fontSize: '0.78rem' }}>Dodaj notatkę</button></div>{item.notes?.length ? <div style={{ display: 'grid', gap: '0.65rem', marginTop: '0.75rem' }}>{item.notes.slice().reverse().map((note) => <div key={note.id} style={{ padding: '0.7rem', borderRadius: '0.5rem', background: '#f8fafc', border: '1px solid var(--color-border)' }}><div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>{note.text}</div><div style={{ marginTop: '0.4rem', color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>{new Date(note.createdAt).toLocaleString('pl-PL')} · {note.author}</div></div>)}</div> : <div style={{ marginTop: '0.65rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Brak zapisanych notatek.</div>}</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem', marginTop: '1rem' }}>
                                    <div style={{ padding: '0.85rem', border: '1px solid #bfdbfe', background: '#f8fbff', borderRadius: '0.6rem' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}><strong>Zadania ({(item.tasks || []).filter((task) => task.status === 'open').length})</strong><button type="button" onClick={() => { setTaskTarget(item); setTaskDraft({ title: '', dueDate: '', owner: '' }); }} style={{ padding: '0.3rem 0.45rem', border: '1px solid #bfdbfe', borderRadius: '0.35rem', background: 'white', color: '#1d4ed8', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>Dodaj zadanie</button></div>{item.tasks?.length ? <div style={{ display: 'grid', gap: '0.45rem', marginTop: '0.65rem' }}>{item.tasks.slice().sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map((task) => <button key={task.id} type="button" onClick={() => void toggleAcquisitionTask(item, task.id)} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', textAlign: 'left', padding: '0.45rem', border: '1px solid var(--color-border)', borderRadius: '0.4rem', background: 'white', cursor: 'pointer', opacity: task.status === 'done' ? 0.55 : 1 }}><span style={{ textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>{task.status === 'done' ? '✓ ' : '○ '}{task.title}</span><span style={{ fontSize: '0.75rem', whiteSpace: 'nowrap', color: 'var(--color-text-muted)' }}>{task.dueDate}</span></button>)}</div> : <div style={{ marginTop: '0.65rem', color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>Brak otwartych zadań.</div>}</div>
                                    <div style={{ padding: '0.85rem', border: '1px solid #bbf7d0', background: '#f6fef8', borderRadius: '0.6rem' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}><strong>Historia kontaktu</strong><button type="button" onClick={() => { setActivityTarget(item); setActivityDraft({ type: 'call', summary: '' }); }} style={{ padding: '0.3rem 0.45rem', border: '1px solid #bbf7d0', borderRadius: '0.35rem', background: 'white', color: '#166534', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>Dodaj wpis</button></div>{item.activities?.length ? <div style={{ display: 'grid', gap: '0.45rem', marginTop: '0.65rem' }}>{item.activities.slice().reverse().map((activity) => <div key={activity.id} style={{ padding: '0.45rem', border: '1px solid var(--color-border)', borderRadius: '0.4rem', background: 'white' }}><div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{({ call: 'Telefon', sms: 'SMS', email: 'E-mail', meeting: 'Spotkanie', other: 'Inne' } as Record<AcquisitionActivity['type'], string>)[activity.type]} — {activity.summary}</div><div style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem', marginTop: '0.2rem' }}>{new Date(activity.createdAt).toLocaleString('pl-PL')} · {activity.author}</div></div>)}</div> : <div style={{ marginTop: '0.65rem', color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>Brak zapisanych kontaktów.</div>}</div>
                                </div>
                                <div style={{ marginTop: '1rem', padding: '0.85rem', border: '1px solid #bae6fd', borderRadius: '0.6rem', background: '#f0f9ff' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}><div><strong>Oferta współpracy</strong><div style={{ marginTop: '0.2rem', color: '#475569', fontSize: '0.78rem' }}>Warunki ustalone po audycie i rozmowie z właścicielem.</div></div><div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>{item.proposal && <button type="button" onClick={() => openProposalDecision(item)} style={{ padding: '0.35rem 0.55rem', border: '1px solid #86efac', borderRadius: '0.4rem', background: 'white', color: '#166534', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>Decyzja właściciela</button>}<button type="button" onClick={() => openProposalEditor(item)} style={{ padding: '0.35rem 0.55rem', border: '1px solid #7dd3fc', borderRadius: '0.4rem', background: 'white', color: '#0369a1', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>{item.proposal ? 'Edytuj warunki' : 'Przygotuj warunki'}</button>{(item.stage === 'proposal' || item.proposal) && <><button type="button" onClick={() => openCooperationDocument(item, 'proposal')} style={{ padding: '0.35rem 0.55rem', border: '1px solid #c4b5fd', borderRadius: '0.4rem', background: '#f5f3ff', color: '#6d28d9', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>{item.generatedProposal ? 'Otwórz proposal' : 'Generuj proposal'}</button><button type="button" onClick={() => openCooperationDocument(item, 'agreement')} style={{ padding: '0.35rem 0.55rem', border: '1px solid #fed7aa', borderRadius: '0.4rem', background: '#fff7ed', color: '#9a3412', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>{item.generatedAgreement ? 'Otwórz umowę' : 'Generuj umowę'}</button></>}</div></div>
                                    {item.proposal ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: '0.55rem', marginTop: '0.75rem' }}><div><span style={{ color: '#64748b', fontSize: '0.74rem' }}>Wariant</span><div style={{ fontWeight: 700, fontSize: '0.84rem' }}>{COOPERATION_PACKAGES[item.proposal.packageVariant && item.proposal.packageVariant in COOPERATION_PACKAGES ? item.proposal.packageVariant : 'start']?.label || 'Wariant niestandardowy'}</div></div><div style={{ gridColumn: '1 / -1', whiteSpace: 'pre-wrap', lineHeight: 1.45, fontSize: '0.86rem' }}><strong>Zakres: </strong>{item.proposal.scope}</div>{item.proposal.commission && <div><span style={{ color: '#64748b', fontSize: '0.74rem' }}>Wynagrodzenie</span><div style={{ fontWeight: 700, fontSize: '0.84rem' }}>{item.proposal.commission}</div></div>}<div><span style={{ color: '#64748b', fontSize: '0.74rem' }}>Forma współpracy</span><div style={{ fontWeight: 700, fontSize: '0.84rem' }}>{item.proposal.agreementType}</div></div>{item.proposal.decisionDate && <div><span style={{ color: '#64748b', fontSize: '0.74rem' }}>Termin decyzji</span><div style={{ fontWeight: 700, fontSize: '0.84rem' }}>{new Date(`${item.proposal.decisionDate}T12:00:00`).toLocaleDateString('pl-PL')}</div></div>}</div> : <div style={{ marginTop: '0.65rem', color: '#64748b', fontSize: '0.82rem' }}>Nie przygotowano jeszcze warunków współpracy.</div>}
                                    {item.proposalDecision && <div style={{ marginTop: '0.7rem', paddingTop: '0.65rem', borderTop: '1px solid #bae6fd', fontSize: '0.84rem' }}><strong>Decyzja właściciela: </strong>{({ accepted: 'zaakceptowano współpracę', considering: 'potrzebuje czasu do namysłu', declined: 'odmowa współpracy' } as Record<ProposalDecision['outcome'], string>)[item.proposalDecision.outcome]}{item.proposalDecision.note && <span> — {item.proposalDecision.note}</span>}</div>}
                                    {(item.generatedProposal || item.generatedAgreement) && <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid #bae6fd' }}>{item.generatedProposal && <span style={{ padding: '0.3rem 0.5rem', borderRadius: '999px', background: '#ede9fe', color: '#6d28d9', fontSize: '0.72rem', fontWeight: 700 }}>Proposal zapisany · {new Date(item.generatedProposal.updatedAt).toLocaleDateString('pl-PL')}</span>}{item.generatedAgreement && <span style={{ padding: '0.3rem 0.5rem', borderRadius: '999px', background: '#ffedd5', color: '#9a3412', fontSize: '0.72rem', fontWeight: 700 }}>Projekt umowy zapisany · {new Date(item.generatedAgreement.updatedAt).toLocaleDateString('pl-PL')}</span>}</div>}
                                </div>
                                <div style={{ marginTop: '1rem', padding: '0.85rem', border: '1px solid var(--color-border)', borderRadius: '0.6rem', background: '#fafafa' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}><strong>Załączniki ({item.attachments?.length || 0})</strong><label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.55rem', border: '1px solid #bfdbfe', borderRadius: '0.4rem', background: 'white', color: '#1d4ed8', cursor: uploadingAttachmentId === item.id ? 'wait' : 'pointer', fontSize: '0.78rem', fontWeight: 700, opacity: uploadingAttachmentId === item.id ? 0.6 : 1 }}><Upload size={14} />{uploadingAttachmentId === item.id ? 'Wgrywanie...' : 'Dodaj plik'}<input type="file" accept="application/pdf,image/*,.doc,.docx" onChange={(event) => void uploadAcquisitionAttachment(item, event)} disabled={uploadingAttachmentId === item.id} style={{ display: 'none' }} /></label></div>{item.attachments?.length ? <div style={{ display: 'grid', gap: '0.4rem', marginTop: '0.65rem' }}>{item.attachments.map((attachment) => <div key={attachment.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.6rem', padding: '0.45rem', background: 'white', border: '1px solid var(--color-border)', borderRadius: '0.4rem' }}><a href={attachment.url} target="_blank" rel="noreferrer" style={{ color: '#1d4ed8', fontSize: '0.84rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{attachment.name}</a><button type="button" onClick={() => void removeAcquisitionAttachment(item, attachment.id)} title="Usuń załącznik" style={{ border: 0, background: 'transparent', color: '#b91c1c', cursor: 'pointer' }}>×</button></div>)}</div> : <div style={{ marginTop: '0.55rem', color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>Dodaj audyt PDF, ofertę współpracy, umowę lub inne dokumenty.</div>}</div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '1rem', flexWrap: 'wrap' }}><button type="button" onClick={() => { setPresentationLeadId(item.id); setPresentationMode('audit'); setViewingPropertyLead(null); setActiveTab('presentation'); }} style={{ padding: '0.65rem 0.9rem', border: '1px solid #fde68a', borderRadius: '0.45rem', background: '#fffbeb', color: '#92400e', cursor: 'pointer', fontWeight: 700 }}>Prezentacja audytu</button><button type="button" onClick={() => void requestActivePropertyConversion(item)} disabled={convertingPropertyLead === item.id || !item.propertyDraft?.title} style={{ padding: '0.65rem 0.9rem', border: '1px solid #86efac', borderRadius: '0.45rem', background: '#f0fdf4', color: '#166534', cursor: 'pointer', fontWeight: 700, opacity: convertingPropertyLead === item.id ? 0.6 : 1 }}>{convertingPropertyLead === item.id ? 'Tworzenie aktywnej oferty...' : item.activePropertyId ? 'Otwórz aktywną ofertę' : 'Przenieś do aktywnych ofert'}</button></div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '1.25rem' }}><a href={item.url} target="_blank" rel="noreferrer" style={{ padding: '0.65rem 0.9rem', borderRadius: '0.45rem', border: '1px solid #bfdbfe', color: '#1d4ed8', textDecoration: 'none', fontWeight: 600 }}>Otwórz {listingSource}</a><button type="button" className="btn-primary" onClick={() => { setViewingPropertyLead(null); openPropertyLeadEditor(item); }}>Edytuj ofertę</button></div>
                            </section>
                        </div>;
                    })()}


                    {callOutcomeTarget && <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 104, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(15,23,42,0.5)' }}><form onSubmit={saveCallOutcome} style={{ width: 'min(540px, 100%)', background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 24px 60px rgba(15,23,42,0.25)' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}><div><h2 style={{ margin: 0 }}>Wynik rozmowy</h2><p style={{ margin: '0.35rem 0 1rem', color: 'var(--color-text-muted)', fontSize: '0.86rem' }}>{callOutcomeTarget.title || 'Potencjalna oferta'}</p></div><button type="button" onClick={() => setCallOutcomeTarget(null)} aria-label="Zamknij" style={{ border: 0, background: 'transparent', fontSize: '1.5rem', cursor: 'pointer' }}>×</button></div><label style={{ display: 'grid', gap: '0.35rem', fontWeight: 600, fontSize: '0.85rem' }}>Rezultat<select value={callOutcomeDraft.outcome} onChange={(event) => setCallOutcomeDraft((draft) => ({ ...draft, outcome: event.target.value as CallOutcome }))} style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem', background: 'white' }}><option value="no_answer">Brak odpowiedzi</option><option value="interested">Zainteresowany rozmową</option><option value="meeting">Umówione spotkanie</option><option value="not_now">Nie teraz — wrócić później</option><option value="not_interested">Brak zainteresowania</option></select></label><label style={{ display: 'grid', gap: '0.35rem', fontWeight: 600, fontSize: '0.85rem', marginTop: '0.75rem' }}>Notatka<textarea rows={4} value={callOutcomeDraft.note} onChange={(event) => setCallOutcomeDraft((draft) => ({ ...draft, note: event.target.value }))} placeholder="Najważniejsze ustalenia z rozmowy..." style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem', resize: 'vertical' }} /></label><label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem', marginTop: '0.75rem' }}>Termin kolejnego kroku (opcjonalnie)<input type="date" value={callOutcomeDraft.followUpDate} onChange={(event) => setCallOutcomeDraft((draft) => ({ ...draft, followUpDate: event.target.value }))} style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem' }} /></label><p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', lineHeight: 1.45 }}>Wpis zostanie dodany do historii kontaktu; etap pozysku i ewentualne zadanie follow-up zaktualizują się automatycznie.</p><div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '1.1rem' }}><button type="button" onClick={() => setCallOutcomeTarget(null)} style={{ padding: '0.65rem 0.9rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem', background: 'white', cursor: 'pointer' }}>Anuluj</button><button type="submit" className="btn-primary" disabled={savingCallOutcome}>{savingCallOutcome ? 'Zapisywanie...' : 'Zapisz wynik'}</button></div></form></div>}

                    {auditTarget && <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 102, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(15,23,42,0.5)', overflowY: 'auto' }}><section style={{ width: 'min(800px, 100%)', margin: 'auto', background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 24px 60px rgba(15,23,42,0.25)' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}><div><div style={{ color: '#6d28d9', fontSize: '0.82rem', fontWeight: 700 }}>Audyt ogłoszenia</div><h2 style={{ margin: '0.2rem 0 0' }}>{auditTarget.title || 'Ogłoszenie z Otodom'}</h2><div style={{ marginTop: '0.35rem', color: 'var(--color-text-secondary)', fontSize: '0.88rem' }}>{[auditTarget.location, auditTarget.price, auditTarget.areaM2 ? `${auditTarget.areaM2} m²` : ''].filter(Boolean).join(' · ')}</div></div><button type="button" aria-label="Zamknij" onClick={() => setAuditTarget(null)} style={{ border: 0, background: 'transparent', fontSize: '1.5rem', cursor: 'pointer' }}>×</button></div><p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', lineHeight: 1.5, margin: '1rem 0' }}>Zapisz konkretne problemy ogłoszenia oraz sposób, w jaki Domiz Homes może poprawić sprzedaż. Oceniaj proces marketingowy i ofertę, nie osobę ani konkurencję.</p><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}><label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>Zdjęcia i ekspozycja<textarea rows={4} value={auditDraft.photos} onChange={(event) => setAuditDraft((draft) => ({ ...draft, photos: event.target.value }))} placeholder="Co nie działa w zdjęciach, ujęciach, świetle lub prezentacji?" style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem', resize: 'vertical' }} /></label><label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>Opis ogłoszenia<textarea rows={4} value={auditDraft.description} onChange={(event) => setAuditDraft((draft) => ({ ...draft, description: event.target.value }))} placeholder="Braki w opisie, układzie informacji i pokazaniu korzyści?" style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem', resize: 'vertical' }} /></label><label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>Cena i pozycjonowanie<textarea rows={4} value={auditDraft.price} onChange={(event) => setAuditDraft((draft) => ({ ...draft, price: event.target.value }))} placeholder="Czy cena i argumentacja wartości są właściwie przedstawione?" style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem', resize: 'vertical' }} /></label><label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>Grupa docelowa<textarea rows={4} value={auditDraft.targetAudience} onChange={(event) => setAuditDraft((draft) => ({ ...draft, targetAudience: event.target.value }))} placeholder="Kto powinien kupić tę nieruchomość i jak do niego dotrzeć?" style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem', resize: 'vertical' }} /></label></div><label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600, marginTop: '0.85rem' }}>Plan działania Domiz Homes<textarea rows={4} value={auditDraft.actionPlan} onChange={(event) => setAuditDraft((draft) => ({ ...draft, actionPlan: event.target.value }))} placeholder="Np. sesja i wideo, home staging, nowa narracja oferty, kampania do wybranej grupy..." style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem', resize: 'vertical' }} /></label><div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '1.1rem', flexWrap: 'wrap' }}><button type="button" onClick={() => setAuditTarget(null)} style={{ padding: '0.65rem 0.9rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem', background: 'white', cursor: 'pointer' }}>Anuluj</button><button type="button" onClick={() => void saveAudit(false)} disabled={savingAudit} style={{ padding: '0.65rem 0.9rem', border: '1px solid #ddd6fe', borderRadius: '0.45rem', background: '#f5f3ff', color: '#6d28d9', cursor: 'pointer', opacity: savingAudit ? 0.6 : 1 }}>Zapisz audyt</button><button type="button" className="btn-primary" onClick={() => void saveAudit(true)} disabled={savingAudit} style={{ opacity: savingAudit ? 0.6 : 1 }}>{savingAudit ? 'Zapisywanie...' : 'Zapisz i przygotuj do kontaktu'}</button></div></section></div>}

                    {isProposalWizardOpen && createPortal(<div role="dialog" aria-modal="true" aria-label="Kreator nowego proposala" className="proposal-wizard-overlay">
                        <section className="proposal-wizard">
                            <header className="proposal-wizard__header">
                                <div><div className="admin-dashboard__eyebrow">NOWY PROPOSAL</div><h2>Stwórz proposal w Gamma</h2><p>Krok {proposalWizardStep} z 3 · wybierasz dane, które Gamma ma uwzględnić w prezentacji.</p></div>
                                <button type="button" onClick={() => setIsProposalWizardOpen(false)} aria-label="Zamknij kreator">×</button>
                            </header>
                            <div className="proposal-wizard__progress" aria-label={`Krok ${proposalWizardStep} z 3`}><span className={proposalWizardStep >= 1 ? 'is-active' : ''}>1. Nieruchomość</span><span className={proposalWizardStep >= 2 ? 'is-active' : ''}>2. Zakres</span><span className={proposalWizardStep >= 3 ? 'is-active' : ''}>3. Warunki i Gamma</span></div>

                            {proposalWizardStep === 1 && <div className="proposal-wizard__body"><h3>Wybierz nieruchomość</h3><p>Proposal zostanie przypisany do tego pozysku i będzie dostępny w panelu klienta po utworzeniu w Gamma.</p><div className="proposal-wizard__leads">{propertyLeads.length ? propertyLeads.map((item) => <button key={item.id} type="button" onClick={() => selectWizardProposalTarget(item)}><span><strong>{item.title || 'Nieruchomość bez tytułu'}</strong><small>{[item.location, item.price, item.ownerName].filter(Boolean).join(' · ') || 'Uzupełnij dane pozysku'}</small></span><ChevronRight size={18} /></button>) : <div className="proposal-wizard__empty">Brak pozysków. Najpierw dodaj nieruchomość w zakładce „Pozyski”.</div>}</div></div>}

                            {proposalWizardStep === 2 && proposalTarget && <div className="proposal-wizard__body"><div className="proposal-wizard__target"><span>PROPOSAL DLA</span><strong>{proposalTarget.title || 'Nieruchomość bez tytułu'}</strong><button type="button" onClick={() => setProposalWizardStep(1)}>Zmień</button></div><h3>Wybierz zakres współpracy</h3><p>Premium zawiera wszystkie działania Start, a Signature zawiera Start i Premium. Odznacz tylko te działania, których nie chcesz umieścić w proposal.</p><div className="proposal-wizard__packages">{(Object.entries(COOPERATION_PACKAGES) as [CooperationPackage, typeof COOPERATION_PACKAGES[CooperationPackage]][]).map(([variant, pack]) => <button key={variant} type="button" aria-pressed={proposalDraft.packageVariant === variant} onClick={() => { const selectedServices = defaultProposalServices(variant); setProposalDraft((draft) => ({ ...draft, packageVariant: variant, selectedServices, scope: buildProposalScope(variant, selectedServices) })); }}><strong>{pack.label}</strong><small>{pack.shortDescription}</small></button>)}</div><div className="proposal-wizard__services">{proposalServicesForPackage(proposalDraft.packageVariant).map((service) => <label key={service}><input type="checkbox" checked={proposalDraft.selectedServices.includes(service)} onChange={() => setProposalDraft((draft) => { const selectedServices = draft.selectedServices.includes(service) ? draft.selectedServices.filter((selected) => selected !== service) : [...draft.selectedServices, service]; return { ...draft, selectedServices, scope: buildProposalScope(draft.packageVariant, selectedServices) }; })} /><span>{service}</span></label>)}</div><div className="proposal-wizard__actions"><button type="button" onClick={() => setProposalWizardStep(1)}>Wstecz</button><button type="button" className="btn-primary" disabled={!proposalDraft.selectedServices.length} onClick={() => setProposalWizardStep(3)}>Dalej: warunki</button></div></div>}

                            {proposalWizardStep === 3 && proposalTarget && <div className="proposal-wizard__body"><div className="proposal-wizard__target"><span>PROPOSAL DLA</span><strong>{proposalTarget.title || 'Nieruchomość bez tytułu'}</strong><button type="button" onClick={() => setProposalWizardStep(1)}>Zmień</button></div><h3>Potwierdź warunki i wygeneruj</h3><p>Najpierw możesz przeczytać wersję roboczą. Gamma otrzyma dokładnie tę treść oraz dane nieruchomości.</p><div className="proposal-wizard__summary"><div><span>Wariant</span><strong>{COOPERATION_PACKAGES[proposalDraft.packageVariant].label}</strong></div><div><span>Wybrane działania</span><ul>{proposalDraft.selectedServices.map((service) => <li key={service}>{service}</li>)}</ul></div></div><div className="proposal-wizard__terms"><label>Wynagrodzenie<input value={proposalDraft.commission} onChange={(event) => setProposalDraft((draft) => ({ ...draft, commission: event.target.value }))} placeholder="np. 2,5% + VAT" /></label><label>Forma umowy<select value={proposalDraft.agreementType} onChange={(event) => setProposalDraft((draft) => ({ ...draft, agreementType: event.target.value }))}><option>Umowa na wyłączność</option><option>Umowa otwarta</option><option>Do ustalenia</option></select></label><label>Termin decyzji<input type="date" value={proposalDraft.decisionDate} onChange={(event) => setProposalDraft((draft) => ({ ...draft, decisionDate: event.target.value }))} /></label></div><label className="proposal-wizard__preview">Podgląd treści wysyłanej do Gamma<textarea readOnly rows={12} value={buildCooperationDocument({ ...proposalTarget, proposal: { ...proposalDraft, scope: buildProposalScope(proposalDraft.packageVariant, proposalDraft.selectedServices), preparedAt: new Date().toISOString() } }, 'proposal')} /></label><div className="proposal-wizard__actions"><button type="button" onClick={() => setProposalWizardStep(2)} disabled={savingProposal || sendingToGamma}>Wstecz</button><button type="button" className="btn-primary" disabled={savingProposal || sendingToGamma || !proposalDraft.selectedServices.length} onClick={() => void createProposalFromWizard()}>{savingProposal || sendingToGamma ? <><Loader2 size={16} className="animate-spin" /> Tworzenie w Gamma…</> : <><Sparkles size={16} /> Stwórz proposal w Gamma</>}</button></div>{gammaNotice && <div className="proposal-wizard__notice">{gammaNotice}</div>}</div>}
                        </section>
                    </div>, document.body)}

                    {proposalTarget && !isProposalWizardOpen && <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 103, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(15,23,42,0.5)', overflowY: 'auto' }}>
                        <form onSubmit={saveProposal} className="cooperation-package-form">
                            <div className="cooperation-package-form__header">
                                <div>
                                    <div className="admin-dashboard__eyebrow">WARUNKI WSPÓŁPRACY</div>
                                    <h2>Oferta współpracy</h2>
                                    <p>{proposalTarget.title || 'Potencjalna oferta'}</p>
                                </div>
                                <button type="button" onClick={() => { setProposalTarget(null); setProposalLoadNotice(''); setProposalInquiryId(''); }} aria-label="Zamknij">×</button>
                            </div>
                            <div className="cooperation-package-form__inquiry">
                                <label>
                                    Zapytanie z Panelu Klienta
                                    <select value={proposalInquiryId} onChange={(event) => setProposalInquiryId(event.target.value)}>
                                        <option value="">Wybierz zapytanie z wyborem wariantu…</option>
                                        {cooperationInquiries.map((inquiry) => {
                                            const label = [
                                                inquiry.payload?.packageName || 'Wariant',
                                                inquiry.payload?.title || inquiry.name,
                                                inquiry.createdAt ? formatDate(inquiry.createdAt) : '',
                                            ].filter(Boolean).join(' · ');
                                            return <option key={inquiry.id} value={inquiry.id}>{label}</option>;
                                        })}
                                    </select>
                                </label>
                                <button type="button" onClick={loadClientSelection} disabled={!proposalInquiryId && cooperationInquiries.length === 0}>
                                    <Sparkles size={14} /> Wczytaj opcje z zapytania
                                </button>
                            </div>
                            {proposalLoadNotice && <div className="cooperation-package-form__notice">{proposalLoadNotice}</div>}
                            <fieldset className="cooperation-package-picker">
                                <legend>Wybierz wariant współpracy</legend>
                                {(Object.entries(COOPERATION_PACKAGES) as [CooperationPackage, typeof COOPERATION_PACKAGES[CooperationPackage]][]).map(([variant, pack]) => {
                                    const active = proposalDraft.packageVariant === variant;
                                    return <button key={variant} type="button" aria-pressed={active} onClick={() => {
                                        const selectedServices = defaultProposalServices(variant);
                                        setProposalDraft((draft) => ({ ...draft, packageVariant: variant, selectedServices, scope: buildProposalScope(variant, selectedServices) }));
                                    }}>
                                        <span className="cooperation-package-picker__radio">{active ? '✓' : ''}</span>
                                        <span><strong>{pack.label}</strong><small>{pack.shortDescription}</small><ul>{pack.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul></span>
                                    </button>;
                                })}
                            </fieldset>
                            <fieldset className="cooperation-service-picker">
                                <legend>Wybierz działania do tego proposala</legend>
                                <p>Te same opcje widzi klient w swoim panelu. Zaznaczone pozycje zostaną zapisane i przekazane do Gamma.</p>
                                <div>
                                    {proposalServicesForPackage(proposalDraft.packageVariant).map((service) => {
                                        const checked = proposalDraft.selectedServices.includes(service);
                                        return <label key={service}>
                                            <input type="checkbox" checked={checked} onChange={() => setProposalDraft((draft) => {
                                                const selectedServices = draft.selectedServices.includes(service)
                                                    ? draft.selectedServices.filter((selected) => selected !== service)
                                                    : [...draft.selectedServices, service];
                                                return { ...draft, selectedServices, scope: buildProposalScope(draft.packageVariant, selectedServices) };
                                            })} />
                                            <span>{service}</span>
                                        </label>;
                                    })}
                                </div>
                                <small>{proposalDraft.selectedServices.length ? `Wybrano ${proposalDraft.selectedServices.length} ${proposalDraft.selectedServices.length === 1 ? 'działanie' : proposalDraft.selectedServices.length < 5 ? 'działania' : 'działań'}.` : 'Zaznacz co najmniej jedno działanie.'}</small>
                            </fieldset>
                            <label className="cooperation-package-form__scope">Zakres współpracy *
                                <span>Zakres jest automatycznie budowany z zaznaczonych działań; w razie potrzeby możesz go dopracować ręcznie.</span>
                                <textarea required rows={12} value={proposalDraft.scope} onChange={(event) => setProposalDraft((draft) => ({ ...draft, scope: event.target.value }))} />
                            </label>
                            <div className="cooperation-package-form__fields">
                                <label>Wynagrodzenie<input value={proposalDraft.commission} onChange={(event) => setProposalDraft((draft) => ({ ...draft, commission: event.target.value }))} placeholder="np. 2,5% + VAT" /></label>
                                <label>Forma umowy<select value={proposalDraft.agreementType} onChange={(event) => setProposalDraft((draft) => ({ ...draft, agreementType: event.target.value }))}><option>Umowa na wyłączność</option><option>Umowa otwarta</option><option>Do ustalenia</option></select></label>
                                <label>Termin decyzji<input type="date" value={proposalDraft.decisionDate} onChange={(event) => setProposalDraft((draft) => ({ ...draft, decisionDate: event.target.value }))} /></label>
                            </div>
                            <div className="cooperation-package-form__actions"><button type="button" onClick={() => { setProposalTarget(null); setProposalLoadNotice(''); setProposalInquiryId(''); }}>Anuluj</button><button type="submit" className="btn-primary" disabled={savingProposal}>{savingProposal ? 'Zapisywanie...' : 'Zapisz warunki współpracy'}</button></div>
                        </form>
                    </div>}

                    {proposalDecisionTarget && <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 104, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(15,23,42,0.5)' }}><form onSubmit={saveProposalDecision} style={{ width: 'min(540px, 100%)', background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 24px 60px rgba(15,23,42,0.25)' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}><div><h2 style={{ margin: 0 }}>Decyzja właściciela</h2><p style={{ margin: '0.35rem 0 1rem', color: 'var(--color-text-muted)', fontSize: '0.86rem' }}>{proposalDecisionTarget.title || 'Potencjalna oferta'}</p></div><button type="button" onClick={() => setProposalDecisionTarget(null)} aria-label="Zamknij" style={{ border: 0, background: 'transparent', fontSize: '1.5rem', cursor: 'pointer' }}>×</button></div><label style={{ display: 'grid', gap: '0.35rem', fontWeight: 600, fontSize: '0.85rem' }}>Wynik rozmowy<select value={proposalDecisionDraft.outcome} onChange={(event) => setProposalDecisionDraft((draft) => ({ ...draft, outcome: event.target.value as ProposalDecision['outcome'] }))} style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem', background: 'white' }}><option value="accepted">Akceptuje współpracę</option><option value="considering">Potrzebuje czasu do namysłu</option><option value="declined">Nie jest zainteresowany</option></select></label><label style={{ display: 'grid', gap: '0.35rem', fontWeight: 600, fontSize: '0.85rem', marginTop: '0.75rem' }}>Ustalenia / powód decyzji<textarea rows={4} value={proposalDecisionDraft.note} onChange={(event) => setProposalDecisionDraft((draft) => ({ ...draft, note: event.target.value }))} placeholder="Np. umowa do podpisu w środę; wrócić z kontaktem za miesiąc." style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem', resize: 'vertical' }} /></label><p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', lineHeight: 1.45 }}>Akceptacja przejdzie do „Pozyskane”, namysł do „Do obserwacji”, a odmowa do „Odrzucone”.</p><div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '1.1rem' }}><button type="button" onClick={() => setProposalDecisionTarget(null)} style={{ padding: '0.65rem 0.9rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem', background: 'white', cursor: 'pointer' }}>Anuluj</button><button type="submit" className="btn-primary" disabled={savingProposalDecision}>{savingProposalDecision ? 'Zapisywanie...' : 'Zapisz decyzję'}</button></div></form></div>}

                    {taskTarget && <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 103, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(15,23,42,0.5)' }}><form onSubmit={addAcquisitionTask} style={{ width: 'min(520px, 100%)', background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 24px 60px rgba(15,23,42,0.25)' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}><div><h2 style={{ margin: 0 }}>Nowe zadanie</h2><p style={{ margin: '0.35rem 0 1rem', color: 'var(--color-text-muted)', fontSize: '0.86rem' }}>{taskTarget.title}</p></div><button type="button" onClick={() => setTaskTarget(null)} aria-label="Zamknij" style={{ border: 0, background: 'transparent', fontSize: '1.5rem', cursor: 'pointer' }}>×</button></div><label style={{ display: 'grid', gap: '0.35rem', fontWeight: 600, fontSize: '0.85rem' }}>Co trzeba zrobić? *<input required autoFocus value={taskDraft.title} onChange={(event) => setTaskDraft((draft) => ({ ...draft, title: event.target.value }))} placeholder="np. Zadzwonić i ustalić termin spotkania" style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem' }} /></label><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}><label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem' }}>Termin *<input required type="date" value={taskDraft.dueDate} onChange={(event) => setTaskDraft((draft) => ({ ...draft, dueDate: event.target.value }))} style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem' }} /></label><label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem' }}>Opiekun<input value={taskDraft.owner} onChange={(event) => setTaskDraft((draft) => ({ ...draft, owner: event.target.value }))} placeholder="np. Tomasz" style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem' }} /></label></div><div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '1.1rem' }}><button type="button" onClick={() => setTaskTarget(null)} style={{ padding: '0.65rem 0.9rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem', background: 'white', cursor: 'pointer' }}>Anuluj</button><button type="submit" className="btn-primary" disabled={savingTask}>{savingTask ? 'Zapisywanie...' : 'Dodaj zadanie'}</button></div></form></div>}

                    {activityTarget && <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 103, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(15,23,42,0.5)' }}><form onSubmit={addAcquisitionActivity} style={{ width: 'min(520px, 100%)', background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 24px 60px rgba(15,23,42,0.25)' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}><div><h2 style={{ margin: 0 }}>Dodaj wpis kontaktowy</h2><p style={{ margin: '0.35rem 0 1rem', color: 'var(--color-text-muted)', fontSize: '0.86rem' }}>{activityTarget.title}</p></div><button type="button" onClick={() => setActivityTarget(null)} aria-label="Zamknij" style={{ border: 0, background: 'transparent', fontSize: '1.5rem', cursor: 'pointer' }}>×</button></div><label style={{ display: 'grid', gap: '0.35rem', fontWeight: 600, fontSize: '0.85rem' }}>Rodzaj kontaktu<select value={activityDraft.type} onChange={(event) => setActivityDraft((draft) => ({ ...draft, type: event.target.value as AcquisitionActivity['type'] }))} style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem', background: 'white' }}><option value="call">Telefon</option><option value="sms">SMS</option><option value="email">E-mail</option><option value="meeting">Spotkanie</option><option value="other">Inne</option></select></label><label style={{ display: 'grid', gap: '0.35rem', fontWeight: 600, fontSize: '0.85rem', marginTop: '0.75rem' }}>Co się wydarzyło? *<textarea required autoFocus rows={5} value={activityDraft.summary} onChange={(event) => setActivityDraft((draft) => ({ ...draft, summary: event.target.value }))} placeholder="np. Właściciel zainteresowany spotkaniem w przyszłym tygodniu." style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem', resize: 'vertical' }} /></label><div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '1.1rem' }}><button type="button" onClick={() => setActivityTarget(null)} style={{ padding: '0.65rem 0.9rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem', background: 'white', cursor: 'pointer' }}>Anuluj</button><button type="submit" className="btn-primary" disabled={savingActivity}>{savingActivity ? 'Zapisywanie...' : 'Zapisz wpis'}</button></div></form></div>}

                    {noteTarget && <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 102, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(15,23,42,0.5)' }}><form onSubmit={addAcquisitionNote} style={{ width: 'min(520px, 100%)', background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 24px 60px rgba(15,23,42,0.25)' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}><div><h2 style={{ margin: 0 }}>Dodaj notatkę</h2><p style={{ margin: '0.35rem 0 1rem', color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>{noteTarget.title || 'Ogłoszenie z Otodom'}</p></div><button type="button" aria-label="Zamknij" onClick={() => setNoteTarget(null)} style={{ border: 0, background: 'transparent', fontSize: '1.5rem', cursor: 'pointer' }}>×</button></div><textarea required autoFocus rows={6} value={newAcquisitionNote} onChange={(event) => setNewAcquisitionNote(event.target.value)} placeholder="Wpisz ustalenia, wynik rozmowy lub kolejny krok..." style={{ width: '100%', padding: '0.7rem', border: '1px solid var(--color-border)', borderRadius: '0.5rem', resize: 'vertical' }} /><div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '1rem' }}><button type="button" onClick={() => setNoteTarget(null)} style={{ padding: '0.65rem 0.9rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem', background: 'white', cursor: 'pointer' }}>Anuluj</button><button type="submit" className="btn-primary" disabled={savingAcquisitionNote} style={{ opacity: savingAcquisitionNote ? 0.6 : 1 }}>{savingAcquisitionNote ? 'Zapisywanie...' : 'Zapisz notatkę'}</button></div></form></div>}

                    {isSourceImportOpen && <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(15,23,42,0.5)' }}><form onSubmit={startSourceImport} style={{ width: 'min(640px, 100%)', background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 24px 60px rgba(15,23,42,0.25)' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}><div><h2 style={{ margin: 0 }}>Dodaj nowy pozysk</h2><p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', margin: '0.35rem 0 1rem' }}>Wklej link i treść z Otodom, OLX lub Facebooka, a następnie sprawdź dane w formularzu.</p></div><button type="button" onClick={() => setIsSourceImportOpen(false)} aria-label="Zamknij" style={{ border: 0, background: 'transparent', fontSize: '1.5rem', cursor: 'pointer' }}>×</button></div><label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>Link do ogłoszenia (Otodom, OLX lub Facebook) *<input required type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://www.olx.pl/... lub https://www.facebook.com/..." style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem' }} /></label><label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600, marginTop: '0.85rem' }}>Skopiowana treść ogłoszenia *<textarea required rows={9} value={sourceText} onChange={(event) => setSourceText(event.target.value)} placeholder="Wklej tutaj całą skopiowaną treść ogłoszenia..." style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem', resize: 'vertical' }} /></label><div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '1.1rem' }}><button type="button" onClick={() => setIsSourceImportOpen(false)} style={{ padding: '0.65rem 0.9rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem', background: 'white', cursor: 'pointer' }}>Anuluj</button><button type="submit" className="btn-primary">Przejdź do formularza oferty</button></div></form></div>}

                    {isPropertyLeadOpen && <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(15,23,42,0.5)', overflowY: 'auto' }}>
                        <form onSubmit={createPropertyLead} style={{ width: 'min(720px, 100%)', margin: 'auto', background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 24px 60px rgba(15,23,42,0.25)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                                <div><h2 style={{ margin: 0 }}>{editingPropertyLeadId ? 'Edytuj ofertę' : 'Sprawdź dane oferty'}</h2><p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', margin: '0.35rem 0 1rem' }}>{editingPropertyLeadId ? 'Zmień dane oferty i zapisz aktualizację.' : 'Dane z ogłoszenia są już wpisane w pola oferty. Uzupełnij lub popraw je przed zapisaniem.'}</p></div>
                                <button type="button" aria-label="Zamknij" onClick={() => { setIsPropertyLeadOpen(false); setNewPropertyLead(EMPTY_PROPERTY_LEAD); setEditingPropertyLeadId(null); }} style={{ border: 0, background: 'transparent', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                            </div>
                            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>Link do ogłoszenia *<input required type="url" value={newPropertyLead.url} onChange={(event) => setNewPropertyLead((draft) => ({ ...draft, url: event.target.value }))} placeholder="https://www.otodom.pl/..., https://www.olx.pl/... lub Facebook" style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem' }} /></label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
                                <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem' }}>Tytuł oferty<input value={newPropertyLead.title} onChange={(event) => setNewPropertyLead((draft) => ({ ...draft, title: event.target.value }))} placeholder="np. Mieszkanie 3-pokojowe" style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem' }} /></label>
                                <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem' }}>Lokalizacja<input value={newPropertyLead.location} onChange={(event) => setNewPropertyLead((draft) => ({ ...draft, location: event.target.value }))} placeholder="np. Katowice, Osiedle Gwiazdy" style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem' }} /></label>
                                <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem' }}>Cena<input value={newPropertyLead.price} onChange={(event) => setNewPropertyLead((draft) => ({ ...draft, price: event.target.value }))} placeholder="np. 890 000 zł" style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem' }} /></label>
                                <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem' }}>Metraż (m²)<input inputMode="decimal" value={newPropertyLead.areaM2} onChange={(event) => setNewPropertyLead((draft) => ({ ...draft, areaM2: event.target.value }))} placeholder="np. 63,5" style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem' }} /></label>
                                <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem' }}>Pokoje<input inputMode="numeric" value={newPropertyLead.rooms} onChange={(event) => setNewPropertyLead((draft) => ({ ...draft, rooms: event.target.value }))} placeholder="np. 3" style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem' }} /></label>
                                <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem' }}>Łazienki<input inputMode="numeric" value={newPropertyLead.baths} onChange={(event) => setNewPropertyLead((draft) => ({ ...draft, baths: event.target.value }))} placeholder="np. 1" style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem' }} /></label>
                                <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem' }}>Typ nieruchomości<select value={newPropertyLead.type} onChange={(event) => setNewPropertyLead((draft) => ({ ...draft, type: event.target.value as NewPropertyLeadDraft['type'] }))} style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem', background: 'white' }}><option value="mieszkanie">Mieszkanie</option><option value="dom">Dom</option><option value="dzialka">Działka</option></select></label>
                                <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem' }}>Rodzaj oferty<select value={newPropertyLead.status} onChange={(event) => setNewPropertyLead((draft) => ({ ...draft, status: event.target.value as NewPropertyLeadDraft['status'] }))} style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem', background: 'white' }}><option value="sprzedaz">Sprzedaż</option><option value="wynajem">Wynajem</option></select></label>
                            </div>
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.65rem' }}>Kontakt do właściciela</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.75rem' }}>
                                    <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem' }}>Imię i nazwisko<input value={newPropertyLead.ownerName} onChange={(event) => setNewPropertyLead((draft) => ({ ...draft, ownerName: event.target.value }))} placeholder="np. Anna Kowalska" style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem' }} /></label>
                                    <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem' }}>Telefon<input type="tel" value={newPropertyLead.ownerPhone} onChange={(event) => setNewPropertyLead((draft) => ({ ...draft, ownerPhone: event.target.value }))} placeholder="np. +48 500 000 000" style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem' }} /></label>
                                    <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem' }}>Opiekun pozysku<select value={newPropertyLead.assignee} onChange={(event) => setNewPropertyLead((draft) => ({ ...draft, assignee: event.target.value }))} style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem', background: 'white' }}><option value="">Nieprzypisany</option>{PROPERTY_CARETAKERS.map((caretaker) => <option key={caretaker} value={caretaker}>{caretaker}</option>)}</select></label>
                                </div>
                            </div>
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.65rem' }}>Szczegóły z ogłoszenia Otodom</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.75rem' }}>
                                    <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem' }}>Cena za m²<input value={newPropertyLead.pricePerM2} onChange={(event) => setNewPropertyLead((draft) => ({ ...draft, pricePerM2: event.target.value }))} placeholder="np. 9 165,28 zł/m²" style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem' }} /></label>
                                    <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem' }}>Ogrzewanie<input value={newPropertyLead.heating} onChange={(event) => setNewPropertyLead((draft) => ({ ...draft, heating: event.target.value }))} placeholder="np. miejskie" style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem' }} /></label>
                                    <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem' }}>Piętro<input value={newPropertyLead.floor} onChange={(event) => setNewPropertyLead((draft) => ({ ...draft, floor: event.target.value }))} placeholder="np. > 10" style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem' }} /></label>
                                    <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem' }}>Czynsz<input value={newPropertyLead.rent} onChange={(event) => setNewPropertyLead((draft) => ({ ...draft, rent: event.target.value }))} placeholder="np. 719 zł/miesiąc" style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem' }} /></label>
                                    <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem' }}>Stan wykończenia<input value={newPropertyLead.finishCondition} onChange={(event) => setNewPropertyLead((draft) => ({ ...draft, finishCondition: event.target.value }))} placeholder="np. do zamieszkania" style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem' }} /></label>
                                    <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem' }}>Rynek<input value={newPropertyLead.market} onChange={(event) => setNewPropertyLead((draft) => ({ ...draft, market: event.target.value }))} placeholder="np. wtórny" style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem' }} /></label>
                                    <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem' }}>Forma własności<input value={newPropertyLead.ownership} onChange={(event) => setNewPropertyLead((draft) => ({ ...draft, ownership: event.target.value }))} placeholder="np. pełna własność" style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem' }} /></label>
                                    <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem' }}>Dostępne od<input value={newPropertyLead.availableFrom} onChange={(event) => setNewPropertyLead((draft) => ({ ...draft, availableFrom: event.target.value }))} placeholder="np. 2026-06-08" style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem' }} /></label>
                                    <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem' }}>Ogłoszeniodawca<input value={newPropertyLead.advertiserType} onChange={(event) => setNewPropertyLead((draft) => ({ ...draft, advertiserType: event.target.value }))} placeholder="np. prywatny" style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem' }} /></label>
                                    <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem' }}>Winda<input value={newPropertyLead.buildingElevator} onChange={(event) => setNewPropertyLead((draft) => ({ ...draft, buildingElevator: event.target.value }))} placeholder="np. tak" style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem' }} /></label>
                                    <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem' }}>Rodzaj zabudowy<input value={newPropertyLead.buildingType} onChange={(event) => setNewPropertyLead((draft) => ({ ...draft, buildingType: event.target.value }))} placeholder="np. blok" style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem' }} /></label>
                                    <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem' }}>Okna<input value={newPropertyLead.windows} onChange={(event) => setNewPropertyLead((draft) => ({ ...draft, windows: event.target.value }))} placeholder="np. plastikowe" style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem' }} /></label>
                                </div>
                            </div>
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}><div><div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Zdjęcia oferty</div><div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>{editingPropertyLeadId ? 'Nowe zdjęcia zapisują się automatycznie. Pierwsze zdjęcie jest główne.' : 'Pierwsze zdjęcie będzie zdjęciem głównym.'}</div></div><label className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: uploadingPropertyLeadImages ? 'wait' : 'pointer', opacity: uploadingPropertyLeadImages ? 0.6 : 1 }}><Upload size={16} />{uploadingPropertyLeadImages ? `Wgrywanie ${propertyLeadImageUploadProgress}%` : 'Dodaj zdjęcia'}<input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple onChange={(event) => void handlePropertyLeadImageUpload(event)} disabled={uploadingPropertyLeadImages} style={{ display: 'none' }} /></label></div>
                                {propertyLeadImageUploadNotice && <div role="status" style={{ marginTop: '0.65rem', padding: '0.55rem 0.7rem', borderRadius: '0.45rem', background: propertyLeadImageUploadNotice.startsWith('Zapisano') ? '#ecfdf5' : '#fff7ed', color: propertyLeadImageUploadNotice.startsWith('Zapisano') ? '#166534' : '#9a3412', fontSize: '0.78rem', fontWeight: 700 }}>{propertyLeadImageUploadNotice}</div>}
                                {newPropertyLead.images.length > 0 && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.65rem', marginTop: '0.85rem' }}>{newPropertyLead.images.map((image, index) => <div key={image} style={{ position: 'relative' }}><img src={image} alt={`Zdjęcie oferty ${index + 1}`} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '0.45rem', border: image === newPropertyLead.image ? '2px solid var(--color-primary)' : '1px solid var(--color-border)' }} />{image === newPropertyLead.image && <span style={{ position: 'absolute', left: '0.35rem', bottom: '0.35rem', padding: '0.14rem 0.35rem', borderRadius: '999px', background: 'rgba(15,23,42,0.75)', color: 'white', fontSize: '0.66rem' }}>Główne</span>}<button type="button" onClick={() => removePropertyLeadImage(image)} aria-label="Usuń zdjęcie" style={{ position: 'absolute', top: '0.3rem', right: '0.3rem', width: '24px', height: '24px', border: 0, borderRadius: '50%', background: 'rgba(185,28,28,0.9)', color: 'white', cursor: 'pointer', lineHeight: 1 }}>×</button></div>)}</div>}
                            </div>
                            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem', marginTop: '0.75rem' }}>Udogodnienia (oddziel przecinkami)<input value={newPropertyLead.features} onChange={(event) => setNewPropertyLead((draft) => ({ ...draft, features: event.target.value }))} placeholder="np. balkon, winda, garaż" style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem' }} /></label>
                            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem', marginTop: '0.75rem' }}>Opis / notatka<textarea rows={4} value={newPropertyLead.note} onChange={(event) => setNewPropertyLead((draft) => ({ ...draft, note: event.target.value }))} placeholder="Opis wklejony z ogłoszenia oraz własne notatki..." style={{ padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem', resize: 'vertical' }} /></label>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '1.1rem' }}><button type="button" onClick={() => { setIsPropertyLeadOpen(false); setNewPropertyLead(EMPTY_PROPERTY_LEAD); setPropertyLeadImageUploadNotice(''); }} disabled={uploadingPropertyLeadImages || creatingPropertyLead} style={{ padding: '0.65rem 0.9rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem', background: 'white', cursor: uploadingPropertyLeadImages || creatingPropertyLead ? 'not-allowed' : 'pointer', opacity: uploadingPropertyLeadImages || creatingPropertyLead ? 0.55 : 1 }}>Anuluj</button><button type="submit" className="btn-primary" disabled={creatingPropertyLead || uploadingPropertyLeadImages} style={{ opacity: creatingPropertyLead || uploadingPropertyLeadImages ? 0.6 : 1 }}>{uploadingPropertyLeadImages ? 'Wgrywanie zdjęć…' : creatingPropertyLead ? (editingPropertyLeadId ? 'Zapisywanie…' : 'Dodawanie…') : editingPropertyLeadId ? 'Zapisz zmiany' : 'Dodaj ogłoszenie'}</button></div>
                        </form>
                    </div>}
                </div>
            )}
            {documentTarget && <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 106, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(15,23,42,0.58)', overflowY: 'auto' }}><section style={{ width: 'min(900px, 100%)', maxHeight: 'calc(100vh - 2rem)', overflow: 'auto', margin: 'auto', background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 24px 60px rgba(15,23,42,0.28)' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}><div><div style={{ color: documentKind === 'proposal' ? '#6d28d9' : '#9a3412', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em' }}>{documentKind === 'proposal' ? 'PROPOSAL DOMIZ HOMES' : 'PROJEKT UMOWY'}</div><h2 style={{ margin: '0.25rem 0 0' }}>{documentKind === 'proposal' ? 'Propozycja współpracy' : 'Umowa pośrednictwa'}</h2><p style={{ margin: '0.35rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{documentTarget.title || 'Potencjalna oferta'}</p></div><button type="button" onClick={() => { setDocumentTarget(null); setGammaNotice(''); setGoogleDocsNotice(''); }} aria-label="Zamknij" style={{ border: 0, background: 'transparent', fontSize: '1.5rem', cursor: 'pointer' }}>×</button></div>{documentKind === 'agreement' && <div style={{ marginTop: '1rem', padding: '0.7rem 0.8rem', border: '1px solid #fed7aa', borderRadius: '0.55rem', background: '#fff7ed', color: '#9a3412', fontSize: '0.8rem', lineHeight: 1.45 }}><strong>Dokument roboczy.</strong> Uzupełnij dane stron, księgę wieczystą, terminy i klauzule, a przed podpisaniem przekaż projekt do weryfikacji prawnej.</div>}{documentKind === 'agreement' && <div style={{ marginTop: '1rem', padding: '0.85rem', border: '1px solid #fed7aa', borderRadius: '0.65rem', background: '#fff7ed' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}><div><div style={{ color: '#9a3412', fontWeight: 800, fontSize: '0.78rem', letterSpacing: '0.06em' }}>PANEL KLIENTA</div><p style={{ margin: '0.25rem 0 0', color: '#9a3412', fontSize: '0.82rem', lineHeight: 1.45 }}>„Zapisz projekt umowy” od razu udostępnia treść klientowi do wglądu. Google Docs jest opcjonalne.</p></div><button type="button" onClick={() => void sendAgreementToGoogleDocs()} disabled={sendingToGoogleDocs || !documentContent.trim()} style={{ padding: '0.65rem 0.9rem', border: '1px solid #fdba74', borderRadius: '0.45rem', background: 'white', color: '#9a3412', cursor: sendingToGoogleDocs ? 'wait' : 'pointer', fontWeight: 700, opacity: sendingToGoogleDocs || !documentContent.trim() ? 0.6 : 1, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>{sendingToGoogleDocs ? <><Loader2 size={15} className="animate-spin" /> Tworzenie Docs…</> : <><FileText size={15} /> Google Docs (opcjonalnie)</>}</button></div>{(googleDocsNotice || documentTarget.generatedAgreement?.google?.docsUrl || documentTarget.generatedAgreement?.content) && <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.45rem' }}>{googleDocsNotice && <div style={{ color: '#9a3412', fontSize: '0.8rem' }}>{googleDocsNotice}</div>}{documentTarget.generatedAgreement?.content && !documentTarget.generatedAgreement?.google?.docsUrl && <div style={{ color: '#166534', fontSize: '0.8rem', fontWeight: 700 }}>Umowa widoczna dla klienta do wglądu (treść z CRM).</div>}{documentTarget.generatedAgreement?.google?.docsUrl && <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}><a href={documentTarget.generatedAgreement.google.docsUrl} target="_blank" rel="noreferrer" style={{ padding: '0.45rem 0.7rem', borderRadius: '0.4rem', border: '1px solid #fdba74', background: 'white', color: '#9a3412', textDecoration: 'none', fontWeight: 700, fontSize: '0.8rem' }}>Otwórz w Google Docs</a>{documentTarget.generatedAgreement.google.viewUrl && <a href={documentTarget.generatedAgreement.google.viewUrl} target="_blank" rel="noreferrer" style={{ padding: '0.45rem 0.7rem', borderRadius: '0.4rem', border: '1px solid #cbd5e1', background: 'white', color: '#334155', textDecoration: 'none', fontWeight: 700, fontSize: '0.8rem' }}>Podgląd Docs</a>}<button type="button" onClick={() => void republishAgreementToClientPortal()} style={{ padding: '0.45rem 0.7rem', borderRadius: '0.4rem', border: '1px solid #86efac', background: '#ecfdf5', color: '#166534', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>Udostępnij w panelu klienta</button></div>}</div>}</div>}{documentKind === 'proposal' && <div style={{ marginTop: '1rem', padding: '0.85rem', border: '1px solid #ddd6fe', borderRadius: '0.65rem', background: '#f5f3ff' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}><div><div style={{ color: '#6d28d9', fontWeight: 800, fontSize: '0.78rem', letterSpacing: '0.06em' }}>GAMMA</div><p style={{ margin: '0.25rem 0 0', color: '#4c1d95', fontSize: '0.82rem', lineHeight: 1.45 }}>„Zapisz proposal” trzyma treść tylko w CRM. Do klienta idzie dopiero wersja z Gamma.</p></div><button type="button" onClick={() => void sendProposalToGamma()} disabled={sendingToGamma || !documentContent.trim()} style={{ padding: '0.65rem 0.9rem', border: '1px solid #c4b5fd', borderRadius: '0.45rem', background: 'white', color: '#6d28d9', cursor: sendingToGamma ? 'wait' : 'pointer', fontWeight: 700, opacity: sendingToGamma || !documentContent.trim() ? 0.6 : 1, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>{sendingToGamma ? <><Loader2 size={15} className="animate-spin" /> Tworzenie w Gamma…</> : <><Sparkles size={15} /> Wyślij do Gamma</>}</button></div>{(gammaNotice || documentTarget.generatedProposal?.gamma?.gammaUrl) && <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.45rem' }}>{gammaNotice && <div style={{ color: '#5b21b6', fontSize: '0.8rem' }}>{gammaNotice}</div>}{documentTarget.generatedProposal?.gamma?.gammaUrl && <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}><a href={documentTarget.generatedProposal.gamma.gammaUrl} target="_blank" rel="noreferrer" style={{ padding: '0.45rem 0.7rem', borderRadius: '0.4rem', border: '1px solid #c4b5fd', background: 'white', color: '#6d28d9', textDecoration: 'none', fontWeight: 700, fontSize: '0.8rem' }}>Otwórz w Gamma</a>{documentTarget.generatedProposal.gamma.exportUrl && <a href={documentTarget.generatedProposal.gamma.exportUrl} target="_blank" rel="noreferrer" style={{ padding: '0.45rem 0.7rem', borderRadius: '0.4rem', border: '1px solid #cbd5e1', background: 'white', color: '#334155', textDecoration: 'none', fontWeight: 700, fontSize: '0.8rem' }}>Pobierz PDF z Gamma</a>}<button type="button" onClick={() => void republishProposalToClientPortal()} style={{ padding: '0.45rem 0.7rem', borderRadius: '0.4rem', border: '1px solid #86efac', background: '#ecfdf5', color: '#166534', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>Udostępnij w panelu klienta</button></div>}</div>}</div>}<label style={{ display: 'grid', gap: '0.4rem', marginTop: '1rem', fontSize: '0.82rem', fontWeight: 700 }}>Treść dokumentu<textarea value={documentContent} onChange={(event) => setDocumentContent(event.target.value)} rows={24} style={{ width: '100%', padding: '0.9rem', border: '1px solid var(--color-border)', borderRadius: '0.6rem', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.84rem', lineHeight: 1.55, background: '#fafafa' }} /></label><div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.65rem', marginTop: '1rem', flexWrap: 'wrap' }}><button type="button" onClick={() => setDocumentContent(buildCooperationDocument(documentTarget, documentKind))} style={{ padding: '0.65rem 0.85rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem', background: 'white', cursor: 'pointer' }}>Przywróć treść z danych CRM</button><div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}><button type="button" onClick={printCooperationDocument} style={{ padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '0.45rem', background: 'white', cursor: 'pointer', fontWeight: 700 }}>Drukuj / zapisz PDF</button><button type="button" className="btn-primary" onClick={() => void saveCooperationDocument()} disabled={savingDocument}>{savingDocument ? 'Zapisywanie...' : documentKind === 'proposal' ? 'Zapisz proposal' : 'Zapisz projekt umowy'}</button></div></div></section></div>}

            {showcasePreviewLead?.showcaseOffer && <ShowcaseOfferPreview listing={showcasePreviewLead} onClose={() => setShowcasePreviewLeadId(null)} onRegenerate={() => void generateShowcaseOffer(showcasePreviewLead.id)} onPublish={() => void requestActivePropertyConversion(showcasePreviewLead, true)} onOpenExisting={() => showcasePreviewLead.activePropertyId && navigate(`/admin/properties/${showcasePreviewLead.activePropertyId}/edit`)} isGenerating={generatingShowcaseId === showcasePreviewLead.id} isPublishing={convertingPropertyLead === showcasePreviewLead.id} />}
            {conversionTarget?.propertyDraft && <PropertyPublishDialog
                listing={conversionTarget}
                options={conversionOptions}
                onOptionsChange={setConversionOptions}
                onClose={() => setConversionTarget(null)}
                onConfirm={() => void createActiveProperty(conversionTarget)}
                isCreating={convertingPropertyLead === conversionTarget.id}
                publishConsentReason={publishBlockReason(consentForLead(conversionTarget, ownerConsentsById))}
            />}
            {activeTab === 'estates' && (() => {
                const estateName = (item: PropertyLead) => {
                    const source = `${item.title || ''} ${item.location || ''}`.toLocaleLowerCase('pl-PL');
                    if (/gwiazd/.test(source)) return 'Osiedle Gwiazdy';
                    if (/zawodzi/.test(source)) return 'Zawodzie';
                    if (/śr[óo]dmieści/.test(source)) return 'Śródmieście';
                    return item.location?.split(',').slice(0, 2).join(',').trim() || 'Bez przypisania';
                };
                const estates = Array.from(propertyLeads.reduce((groups, item) => { const name = estateName(item); const current = groups.get(name) || []; current.push(item); groups.set(name, current); return groups; }, new Map<string, PropertyLead[]>()).entries()).sort(([, a], [, b]) => b.length - a.length);
                return <div className="glass-panel" style={{ padding: '1.25rem' }}><div><h2 style={{ margin: 0 }}>Osiedla i mikro-rynki</h2><p style={{ margin: '0.35rem 0 1.25rem', color: 'var(--color-text-muted)' }}>Grupuj pozyski według lokalizacji, porównuj ceny i sprawdzaj, gdzie warto prowadzić aktywne działania.</p></div>{estates.length ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.85rem' }}>{estates.map(([name, items]) => { const withPrice = items.filter((item) => item.propertyDraft?.price); const averagePrice = withPrice.length ? Math.round(withPrice.reduce((sum, item) => sum + (item.propertyDraft?.price || 0), 0) / withPrice.length) : 0; const perM2 = items.map((item) => Number((item.sourceDetails?.pricePerM2 || '').replace(/[^\d,]/g, '').replace(',', '.'))).filter(Boolean); const averagePerM2 = perM2.length ? Math.round(perM2.reduce((sum, value) => sum + value, 0) / perM2.length) : 0; const open = items.filter((item) => !['acquired', 'rejected'].includes(item.stage || 'new')).length; return <article key={name} style={{ padding: '1rem', border: '1px solid #99f6e4', borderRadius: '0.75rem', background: 'linear-gradient(145deg, #f0fdfa, #fff)' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}><div><div style={{ color: '#0f766e', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.06em' }}>MIKRO-RYNEK</div><h3 style={{ margin: '0.3rem 0 0' }}>{name}</h3></div><div style={{ width: '38px', height: '38px', display: 'grid', placeItems: 'center', borderRadius: '50%', background: '#ccfbf1', color: '#0f766e', fontWeight: 800 }}>{items.length}</div></div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '1rem' }}><div style={{ padding: '0.55rem', background: 'white', borderRadius: '0.45rem' }}><div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Śr. cena</div><strong style={{ fontSize: '0.86rem' }}>{averagePrice ? `${averagePrice.toLocaleString('pl-PL')} zł` : '—'}</strong></div><div style={{ padding: '0.55rem', background: 'white', borderRadius: '0.45rem' }}><div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Śr. zł/m²</div><strong style={{ fontSize: '0.86rem' }}>{averagePerM2 ? `${averagePerM2.toLocaleString('pl-PL')} zł` : '—'}</strong></div><div style={{ padding: '0.55rem', background: 'white', borderRadius: '0.45rem' }}><div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Aktywne</div><strong style={{ fontSize: '0.86rem' }}>{open}</strong></div></div><div style={{ marginTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}><span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>{items.slice(0, 2).map((item) => item.title || 'Ogłoszenie').join(' · ')}{items.length > 2 ? '…' : ''}</span><button type="button" onClick={() => { setAcquisitionSearch(name === 'Osiedle Gwiazdy' ? 'Gwiazdy' : name); setAcquisitionFilter('all'); setActiveTab('acquisition'); }} style={{ padding: '0.4rem 0.55rem', border: '1px solid #99f6e4', borderRadius: '0.4rem', background: 'white', color: '#0f766e', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem' }}>Zobacz oferty</button></div></article>; })}</div> : <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Dodaj pierwsze pozyski, aby zbudować bazę osiedli.</div>}</div>;
            })()}

            {activeTab === 'presentation' && (() => {
                const selected = propertyLeads.find((item) => item.id === presentationLeadId);
                return <div id="domiz-presentation-print" className="glass-panel" style={{ padding: '1.5rem' }}>
                    <style>{'@media print { body * { visibility: hidden !important; } #domiz-presentation-print, #domiz-presentation-print * { visibility: visible !important; } #domiz-presentation-print { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; } }'}</style>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}><div><h2 style={{ margin: 0 }}>{presentationMode === 'audit' ? 'Audyty' : 'Prezentacje'}</h2><p style={{ margin: '0.35rem 0 0', color: 'var(--color-text-muted)' }}>{presentationMode === 'audit' ? 'Prezentacje indywidualnych audytów pozyskanych nieruchomości.' : 'Materiały do spotkania z właścicielem — agencja i strategia przejęcia.'}</p></div>{presentationMode !== 'audit' && <button type="button" onClick={() => window.print()} style={{ padding: '0.55rem 0.8rem', border: '1px solid var(--color-border)', borderRadius: '0.45rem', background: 'white', cursor: 'pointer', fontWeight: 600 }}>Drukuj / zapisz PDF</button>}</div>
                    <div style={{ display: 'flex', gap: '0.55rem', marginTop: '1.25rem', flexWrap: 'wrap' }}><button type="button" onClick={() => setPresentationMode('agency')} style={{ padding: '0.55rem 0.8rem', borderRadius: '0.45rem', border: presentationMode === 'agency' ? '1px solid #2563eb' : '1px solid var(--color-border)', background: presentationMode === 'agency' ? '#eff6ff' : 'white', color: presentationMode === 'agency' ? '#1d4ed8' : 'var(--color-text-main)', cursor: 'pointer', fontWeight: 700 }}>Domiz Homes</button><button type="button" onClick={() => setPresentationMode('strategy')} style={{ padding: '0.55rem 0.8rem', borderRadius: '0.45rem', border: presentationMode === 'strategy' ? '1px solid #7c3aed' : '1px solid var(--color-border)', background: presentationMode === 'strategy' ? '#f5f3ff' : 'white', color: presentationMode === 'strategy' ? '#6d28d9' : 'var(--color-text-main)', cursor: 'pointer', fontWeight: 700 }}>Strategia przejęcia</button><button type="button" onClick={() => setPresentationMode('audit')} style={{ padding: '0.55rem 0.8rem', borderRadius: '0.45rem', border: presentationMode === 'audit' ? '1px solid #b45309' : '1px solid var(--color-border)', background: presentationMode === 'audit' ? '#fffbeb' : 'white', color: presentationMode === 'audit' ? '#92400e' : 'var(--color-text-main)', cursor: 'pointer', fontWeight: 700 }}>Audyt oferty</button></div>
                    {presentationMode === 'agency' && <section style={{ marginTop: '1.25rem', padding: 'clamp(1.5rem, 5vw, 4rem)', minHeight: '420px', borderRadius: '1rem', background: 'linear-gradient(135deg, #0f172a, #1d4ed8)', color: 'white' }}><div style={{ color: '#93c5fd', fontWeight: 700, letterSpacing: '0.08em', fontSize: '0.8rem' }}>DOMIZ HOMES</div><h1 style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', maxWidth: '760px', margin: '1rem 0' }}>Sprzedajemy nieruchomości przez strategię, nie przypadek.</h1><p style={{ maxWidth: '620px', fontSize: '1.1rem', lineHeight: 1.6, color: '#dbeafe' }}>Łączymy przygotowanie oferty, profesjonalną prezentację, precyzyjne pozycjonowanie i aktywne dotarcie do właściwych kupujących.</p><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem', marginTop: '2rem' }}>{[['Przygotowanie', 'audyt i plan sprzedaży'], ['Prezentacja', 'zdjęcia, wideo i narracja'], ['Dystrybucja', 'kampanie do właściwej grupy']].map(([title, text]) => <div key={title} style={{ padding: '1rem', borderRadius: '0.65rem', background: 'rgba(255,255,255,0.12)' }}><strong>{title}</strong><div style={{ marginTop: '0.35rem', color: '#dbeafe', fontSize: '0.88rem' }}>{text}</div></div>)}</div></section>}
                    {presentationMode === 'strategy' && <section style={{ marginTop: '1.25rem', padding: 'clamp(1.5rem, 4vw, 3rem)', minHeight: '420px', borderRadius: '1rem', background: '#faf5ff', border: '1px solid #ddd6fe' }}><div style={{ color: '#6d28d9', fontWeight: 700, letterSpacing: '0.08em', fontSize: '0.8rem' }}>STRATEGIA PRZEJĘCIA OFERTY</div><h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', margin: '0.8rem 0 1.75rem' }}>Pokazujemy właścicielowi lepszy plan sprzedaży.</h1><div style={{ display: 'grid', gap: '0.75rem' }}>{[['01', 'Audyt obecnego ogłoszenia', 'Identyfikujemy konkretne braki: prezentację, opis, pozycjonowanie i dotarcie.'], ['02', 'Plan naprawczy', 'Pokazujemy, co zmienimy i jak wpłynie to na odbiór oferty.'], ['03', 'Prezentacja wartości', 'Mówimy o procesie oraz efekcie dla właściciela — bez oceniania konkurencji.'], ['04', 'Jasny kolejny krok', 'Ustalamy zakres współpracy, termin decyzji i działanie po podpisaniu umowy.']].map(([number, title, text]) => <div key={number} style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: '0.75rem', padding: '0.9rem', background: 'white', borderRadius: '0.65rem', border: '1px solid #e9d5ff' }}><div style={{ color: '#7c3aed', fontWeight: 800, fontSize: '1.1rem' }}>{number}</div><div><strong>{title}</strong><div style={{ color: 'var(--color-text-secondary)', marginTop: '0.2rem', fontSize: '0.9rem' }}>{text}</div></div></div>)}</div></section>}
                    {presentationMode === 'audit' && <AuditWorkspace selected={selected} leads={propertyLeads} onSelect={setPresentationLeadId} onBack={() => setActiveTab('acquisition')} onEdit={(item) => { setActiveTab('acquisition'); openAudit(item); }} onRegenerateWithComments={(item, comments) => generateAiAudit(item.id, comments)} onGenerateShowcase={(item) => generateShowcaseOffer(item.id)} onPublish={(item) => requestActivePropertyConversion(item, true)} onOpenExisting={(item) => item.activePropertyId && navigate(`/admin/properties/${item.activePropertyId}/edit`)} isGenerating={Boolean(selected && generatingAuditId === selected.id)} isGeneratingShowcase={Boolean(selected && generatingShowcaseId === selected.id)} isPublishing={Boolean(selected && convertingPropertyLead === selected.id)} />}
                </div>;
            })()}

            {(activeTab === 'proposals' || activeTab === 'agreements') && (() => {
                const kind: CooperationDocumentKind = activeTab === 'proposals' ? 'proposal' : 'agreement';
                const isProposal = kind === 'proposal';
                const documents = propertyLeads
                    .filter((item) => Boolean(isProposal ? item.generatedProposal : item.generatedAgreement))
                    .sort((a, b) => {
                        const first = isProposal ? a.generatedProposal?.updatedAt : a.generatedAgreement?.updatedAt;
                        const second = isProposal ? b.generatedProposal?.updatedAt : b.generatedAgreement?.updatedAt;
                        return (second || '').localeCompare(first || '');
                    });
                const accent = isProposal ? '#6d28d9' : '#9a3412';
                const border = isProposal ? '#ddd6fe' : '#fed7aa';
                const background = isProposal ? '#faf5ff' : '#fff7ed';
                return <div className="glass-panel" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                        <div>
                            <div style={{ color: accent, fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em' }}>CENTRUM DOKUMENTÓW</div>
                            <h2 style={{ margin: '0.25rem 0 0' }}>{isProposal ? 'Proposale' : 'Umowy'}</h2>
                            <p style={{ margin: '0.35rem 0 0', color: 'var(--color-text-muted)' }}>{isProposal ? 'Wszystkie zapisane propozycje współpracy dla właścicieli nieruchomości.' : 'Wszystkie zapisane projekty umów pośrednictwa przypisane do pozysków.'}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                            {isProposal && <a href="/admin?newProposal=1" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', minHeight: '42px', textDecoration: 'none' }}><Sparkles size={16} /> Stwórz nowy proposal</a>}
                            <div style={{ minWidth: '120px', padding: '0.7rem 0.9rem', border: `1px solid ${border}`, borderRadius: '0.7rem', background, textAlign: 'center' }}>
                                <div style={{ color: accent, fontSize: '1.45rem', fontWeight: 800 }}>{documents.length}</div>
                                <div style={{ color: '#64748b', fontSize: '0.72rem' }}>{isProposal ? 'zapisanych proposali' : 'projektów umów'}</div>
                            </div>
                        </div>
                    </div>
                    {documents.length ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 330px), 1fr))', gap: '0.85rem', marginTop: '1.25rem' }}>
                        {documents.map((item) => {
                            const generatedDocument = isProposal ? item.generatedProposal! : item.generatedAgreement!;
                            const stage = ACQUISITION_STAGES.find((option) => option.id === (item.stage || 'new'));
                            return <article key={item.id} style={{ display: 'grid', gap: '0.8rem', padding: '1rem', border: `1px solid ${border}`, borderRadius: '0.8rem', background: 'white', boxShadow: '0 10px 26px rgba(15,23,42,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ color: accent, fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.06em' }}>{isProposal ? 'PROPOSAL' : 'PROJEKT UMOWY'}</div>
                                        <h3 style={{ margin: '0.25rem 0 0', fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title || 'Nieruchomość bez tytułu'}</h3>
                                        <div style={{ marginTop: '0.3rem', color: '#64748b', fontSize: '0.78rem', lineHeight: 1.4 }}>{item.location || 'Lokalizacja do uzupełnienia'}{item.price ? ` · ${item.price}` : ''}</div>
                                    </div>
                                    {stage && <span style={{ flexShrink: 0, padding: '0.28rem 0.45rem', borderRadius: '999px', background: stage.background, color: stage.color, fontSize: '0.68rem', fontWeight: 700 }}>{stage.label}</span>}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.5rem' }}>
                                    <div style={{ padding: '0.55rem', borderRadius: '0.5rem', background: '#f8fafc' }}><div style={{ color: '#64748b', fontSize: '0.68rem' }}>Ostatnia zmiana</div><strong style={{ display: 'block', marginTop: '0.15rem', fontSize: '0.78rem' }}>{new Date(generatedDocument.updatedAt).toLocaleString('pl-PL')}</strong></div>
                                    <div style={{ padding: '0.55rem', borderRadius: '0.5rem', background: '#f8fafc' }}><div style={{ color: '#64748b', fontSize: '0.68rem' }}>Autor</div><strong style={{ display: 'block', marginTop: '0.15rem', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{generatedDocument.generatedBy || item.assignee || 'Domiz Homes'}</strong></div>
                                </div>
                                {(() => {
                                    const gamma = item.generatedProposal?.gamma;
                                    const isLive = isProposal ? Boolean(gamma?.publishedAt) : Boolean(item.generatedAgreement?.content);
                                    const gammaWorking = ['pending', 'processing', 'generating'].includes(gamma?.status || '');
                                    const proposalStatus = gamma?.status === 'failed'
                                        ? `Błąd Gamma: ${gamma.error || 'spróbuj ponownie'}`
                                        : gammaWorking ? 'Gamma generuje proposal…'
                                            : gamma?.gammaUrl ? (isLive ? 'Gamma gotowa — widoczna dla klienta' : 'Gamma gotowa — sprawdź i udostępnij klientowi')
                                                : 'Wersja robocza w CRM — wyślij do Gamma';
                                    return <div style={{ padding: '0.55rem 0.65rem', borderRadius: '0.5rem', border: isLive ? '1px solid #86efac' : (isProposal ? '1px solid #ddd6fe' : '1px solid #fed7aa'), background: isLive ? '#ecfdf5' : (isProposal ? '#f5f3ff' : '#fff7ed'), color: isLive ? '#166534' : (isProposal ? '#6d28d9' : '#9a3412'), fontSize: '0.78rem', fontWeight: 700 }}>{isProposal ? proposalStatus : (isLive ? 'Umowa widoczna dla klienta do wglądu' : 'Brak treści umowy')}</div>;
                                })()}
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
                                    <button type="button" onClick={() => openCooperationDocument(item, kind)} style={{ flex: '1 1 150px', padding: '0.55rem 0.7rem', border: `1px solid ${border}`, borderRadius: '0.45rem', background, color: accent, cursor: 'pointer', fontWeight: 700 }}>{isProposal ? 'Otwórz proposal' : 'Otwórz umowę'}</button>
                                    {isProposal && <button type="button" onClick={() => openCooperationDocument(item, 'proposal')} style={{ flex: '1 1 150px', padding: '0.55rem 0.7rem', border: '1px solid #c4b5fd', borderRadius: '0.45rem', background: '#f5f3ff', color: '#6d28d9', cursor: 'pointer', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}><Sparkles size={14} /> {item.generatedProposal?.gamma?.gammaUrl ? 'Gamma / ponów' : 'Wyślij do Gamma'}</button>}
                                    {isProposal && <a href={`/admin?newProposal=1&listingId=${encodeURIComponent(item.id)}`} style={{ flex: '1 1 150px', padding: '0.55rem 0.7rem', border: '1px solid #c4b5fd', borderRadius: '0.45rem', background: 'white', color: '#6d28d9', textDecoration: 'none', textAlign: 'center', fontWeight: 700 }}>Nowa wersja{item.proposalVersions?.length ? ` (${item.proposalVersions.length + 1})` : ''}</a>}
                                    <button type="button" onClick={() => { setViewingPropertyLead(item); setActiveTab('acquisition'); }} style={{ flex: '1 1 150px', padding: '0.55rem 0.7rem', border: '1px solid #cbd5e1', borderRadius: '0.45rem', background: 'white', color: '#334155', cursor: 'pointer', fontWeight: 700 }}>Pokaż pozysk</button>
                                </div>
                            </article>;
                        })}
                    </div> : <div style={{ marginTop: '1.25rem', padding: 'clamp(2rem, 8vw, 4rem) 1rem', border: `1px dashed ${border}`, borderRadius: '0.8rem', background, textAlign: 'center' }}>
                        <div style={{ color: accent, fontWeight: 800 }}>{isProposal ? 'Brak zapisanych proposali' : 'Brak zapisanych projektów umów'}</div>
                        <p style={{ maxWidth: '520px', margin: '0.45rem auto 1rem', color: '#64748b', fontSize: '0.86rem', lineHeight: 1.5 }}>{isProposal ? 'Wygeneruj i zapisz proposal na etapie „Oferta współpracy”, a automatycznie pojawi się w tej sekcji.' : 'Wygeneruj i zapisz projekt umowy przy pozysku, a automatycznie pojawi się w tej sekcji.'}</p>
                        <button type="button" onClick={() => { setAcquisitionFilter('proposal'); setActiveTab('acquisition'); }} style={{ padding: '0.6rem 0.85rem', border: `1px solid ${border}`, borderRadius: '0.45rem', background: 'white', color: accent, cursor: 'pointer', fontWeight: 700 }}>Przejdź do ofert współpracy</button>
                    </div>}
                </div>;
            })()}

            {activeTab === 'clientAccounts' && <ClientAccountCreator properties={properties.map(({ id, title, location }) => ({ id, title, location }))} />}

            {activeTab === 'videos' && (
                <VideoStudio properties={properties} initialPropertyId={videoStudioPropertyId} />
            )}

            {activeTab === 'settings' && (
                <AdminSettingsPanel />
            )}
        </div>
    );
};

interface AuditWorkspaceProps {
    selected?: PropertyLead;
    leads: PropertyLead[];
    onSelect: (id: string) => void;
    onBack: () => void;
    onEdit: (item: PropertyLead) => void;
    onRegenerateWithComments: (item: PropertyLead, comments: string) => Promise<boolean>;
    onGenerateShowcase: (item: PropertyLead) => Promise<boolean>;
    onPublish: (item: PropertyLead) => Promise<void>;
    onOpenExisting: (item: PropertyLead) => void;
    isGenerating: boolean;
    isGeneratingShowcase: boolean;
    isPublishing: boolean;
}

function AuditWorkspace({ selected, leads, onSelect, onBack, onEdit, onRegenerateWithComments, onGenerateShowcase, onPublish, onOpenExisting, isGenerating, isGeneratingShowcase, isPublishing }: AuditWorkspaceProps) {
    const [isCommenting, setIsCommenting] = useState(false);
    const [agentComments, setAgentComments] = useState('');
    const [auditLanguage, setAuditLanguage] = useState<AuditLanguage>('pl');
    const [showShowcase, setShowShowcase] = useState(false);
    const localizedAudit = selected
        ? selected.auditTranslations?.[auditLanguage] || (auditLanguage === 'pl' && selected.auditData ? { auditData: selected.auditData, auditSummary: selected.auditSummary || '' } : undefined)
        : undefined;
    const hasAdvancedAudit = Boolean(localizedAudit?.auditData?.scores || localizedAudit?.auditData?.overallScore);
    const hasEnglishAudit = Boolean(selected?.auditTranslations?.en);
    const ui = auditLanguage === 'pl'
        ? { ready: 'GOTOWY AUDYT', report: 'Audyt ogłoszenia', rooms: 'pokoje', comment: 'Skomentuj audyt', cancelComment: 'Anuluj komentarz', edit: 'Edytuj audyt', pdf: 'Zapisz PDF (PL)', summary: 'Pełne podsumowanie tekstowe', noLanguage: 'Wersja angielska pojawi się po ponownym wygenerowaniu audytu.', feedback: 'Historia uwag agentów' }
        : { ready: 'AUDIT READY', report: 'Listing audit', rooms: 'rooms', comment: 'Comment on audit', cancelComment: 'Cancel comment', edit: 'Edit audit', pdf: 'Save PDF (EN)', summary: 'Full text summary', noLanguage: 'The English version will be available after regenerating this audit.', feedback: 'Agent feedback history' };
    const submitAuditComments = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selected || !agentComments.trim() || isGenerating) return;
        const generated = await onRegenerateWithComments(selected, agentComments.trim());
        if (generated) { setAgentComments(''); setIsCommenting(false); }
    };
    const saveSelectedLanguageAsPdf = () => {
        if (!selected || !localizedAudit) return;
        const previousTitle = document.title;
        const safeTitle = (selected.title || 'audyt').replace(/[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ -]/g, '').trim().replace(/\s+/g, '-').toLowerCase();
        const cleanup = () => { document.body.classList.remove('audit-print-mode'); document.title = previousTitle; };
        document.title = `domiz-homes-${safeTitle || 'audyt'}-${auditLanguage}`;
        document.body.classList.add('audit-print-mode');
        window.addEventListener('afterprint', cleanup, { once: true });
        window.print();
        window.setTimeout(cleanup, 10000);
    };
    const generateAndOpenShowcase = async () => {
        if (!selected || isGeneratingShowcase) return;
        const generated = await onGenerateShowcase(selected);
        if (generated) setShowShowcase(true);
    };
    return (
        <section className="audit-workspace" style={{ marginTop: '1.25rem' }}>
            <div className="audit-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: '1rem', flexWrap: 'wrap', width: '100%' }}>
                <button type="button" onClick={onBack} style={{ padding: '0.55rem 0.8rem', border: '1px solid var(--color-border)', borderRadius: '0.5rem', background: 'white', color: 'var(--color-text-main)', cursor: 'pointer', fontWeight: 700 }}>← Wróć do pozysków</button>
                <label style={{ display: 'grid', gap: '0.35rem', flex: '0 1 430px', width: '100%', minWidth: 0, maxWidth: '430px', fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>Zmień audyt<select value={selected?.id || ''} onChange={(event) => { setIsCommenting(false); setAgentComments(''); setAuditLanguage('pl'); onSelect(event.target.value); }} title={selected ? `${selected.title || 'Ogłoszenie'} — ${selected.location || 'bez lokalizacji'}` : 'Wybierz pozysk'} style={{ display: 'block', boxSizing: 'border-box', width: '100%', minWidth: 0, maxWidth: '100%', padding: '0.7rem 2.25rem 0.7rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '0.5rem', background: 'white', color: 'var(--color-text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}><option value="">Wybierz pozysk...</option>{leads.filter((item) => item.auditSummary).map((item) => <option key={item.id} value={item.id}>{item.title || 'Ogłoszenie'} — {item.location || 'bez lokalizacji'}</option>)}</select></label>
            </div>
            {selected ? <article id="audit-print-report" data-language={auditLanguage} style={{ marginTop: '1rem', padding: 'clamp(1.25rem, 3vw, 2.25rem)', border: '1px solid #e2e8f0', borderRadius: '1rem', background: 'white', boxShadow: '0 12px 32px rgba(15,23,42,0.06)' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap', paddingBottom: '1.25rem', borderBottom: '1px solid #e2e8f0' }}><div><div style={{ color: '#047857', fontWeight: 800, fontSize: '0.78rem', letterSpacing: '0.06em' }}>{ui.ready}</div><h1 style={{ margin: '0.4rem 0 0.3rem', fontSize: 'clamp(1.75rem, 4vw, 3rem)', letterSpacing: '-0.035em' }}>{selected.title || ui.report}</h1><div style={{ color: 'var(--color-text-secondary)' }}>{[selected.location, selected.price, selected.areaM2 ? `${selected.areaM2} m²` : '', selected.rooms ? `${selected.rooms} ${ui.rooms}` : ''].filter(Boolean).join(' · ')}</div></div><div className="audit-report-actions" style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}><button type="button" className="showcase-offer-button" onClick={() => selected.showcaseOffer ? setShowShowcase(true) : void generateAndOpenShowcase()} disabled={isGeneratingShowcase}><Sparkles size={16} /> {isGeneratingShowcase ? 'Tworzę ofertę...' : selected.showcaseOffer ? 'Pokaż ofertę pokazową' : 'Wygeneruj ofertę pokazową'}</button><div className="audit-language-switch" role="group" aria-label="Język audytu"><button type="button" className={auditLanguage === 'pl' ? 'is-active' : ''} onClick={() => setAuditLanguage('pl')}>PL</button><button type="button" className={auditLanguage === 'en' ? 'is-active' : ''} onClick={() => setAuditLanguage('en')}>EN</button></div><button type="button" onClick={saveSelectedLanguageAsPdf} disabled={!localizedAudit} className="audit-pdf-button"><Download size={16} /> {ui.pdf}</button><button type="button" onClick={() => setIsCommenting((value) => !value)} style={{ padding: '0.65rem 0.9rem', border: '1px solid #a7f3d0', borderRadius: '0.5rem', background: '#ecfdf5', color: '#047857', cursor: 'pointer', fontWeight: 700 }}>{isCommenting ? ui.cancelComment : ui.comment}</button><button type="button" onClick={() => onEdit(selected)} style={{ padding: '0.65rem 0.9rem', border: '1px solid #ddd6fe', borderRadius: '0.5rem', background: '#f5f3ff', color: '#6d28d9', cursor: 'pointer', fontWeight: 700 }}>{ui.edit}</button></div></header>
                {isCommenting && <form onSubmit={submitAuditComments} className="audit-comment-box"><div><strong>Uwagi agenta do nowej wersji audytu</strong><p>Wpisz informacje, które AI powinno uwzględnić, poprawić lub zweryfikować w całym raporcie.</p></div><textarea autoFocus required rows={5} value={agentComments} onChange={(event) => setAgentComments(event.target.value)} placeholder="Np. mieszkanie wymaga generalnego remontu, właścicielowi zależy na sprzedaży w ciągu 30 dni, a realna cena minimalna to 410 000 zł..." /><div className="audit-comment-box__actions"><button type="button" onClick={() => { setIsCommenting(false); setAgentComments(''); }}>Anuluj</button><button type="submit" className="btn-primary" disabled={isGenerating || !agentComments.trim()}>{isGenerating ? 'Tworzę nowy audyt...' : 'Uwzględnij uwagi i wygeneruj nowy audyt'}</button></div></form>}
                {!localizedAudit && <div className="audit-language-empty">{auditLanguage === 'en' && !hasEnglishAudit ? ui.noLanguage : ui.noLanguage}</div>}
                {hasAdvancedAudit ? <AdvancedAuditPanel audit={localizedAudit?.auditData} versions={selected.auditVersions} language={auditLanguage} /> : localizedAudit && <div style={{ marginTop: '1.25rem', padding: '1rem', borderRadius: '0.65rem', background: '#f5f3ff', border: '1px solid #ddd6fe', whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>{localizedAudit.auditSummary}</div>}
                {hasAdvancedAudit && localizedAudit?.auditSummary && <details className="audit-full-summary" style={{ marginTop: '1.25rem', border: '1px solid #ddd6fe', borderRadius: '0.65rem', background: '#faf5ff' }}><summary style={{ padding: '0.9rem 1rem', color: '#6d28d9', cursor: 'pointer', fontWeight: 700 }}>{ui.summary}</summary><div style={{ padding: '0 1rem 1rem', whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>{localizedAudit.auditSummary}</div></details>}
                {selected.auditFeedback?.length ? <details className="audit-feedback-history"><summary>{ui.feedback} ({selected.auditFeedback.length})</summary><div>{selected.auditFeedback.slice().reverse().map((feedback) => <article key={feedback.id}><p>{feedback.text}</p><small>{new Date(feedback.createdAt).toLocaleString(auditLanguage === 'pl' ? 'pl-PL' : 'en-GB')} · {feedback.author}</small></article>)}</div></details> : null}
            </article> : <div style={{ marginTop: '1rem', padding: '4rem 1rem', border: '1px dashed var(--color-border)', borderRadius: '0.75rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Wybierz ofertę z gotowym audytem.</div>}
            {selected?.showcaseOffer && showShowcase && <ShowcaseOfferPreview listing={selected} onClose={() => setShowShowcase(false)} onRegenerate={() => void generateAndOpenShowcase()} onPublish={() => void onPublish(selected)} onOpenExisting={() => onOpenExisting(selected)} isGenerating={isGeneratingShowcase} isPublishing={isPublishing} />}
        </section>
    );
}

interface PropertyPublishDialogProps {
    listing: PropertyLead;
    options: { priceMode: 'audit' | 'current'; publishNow: boolean; propertyMode: 'new' | 'update' };
    onOptionsChange: (options: { priceMode: 'audit' | 'current'; publishNow: boolean; propertyMode: 'new' | 'update' }) => void;
    onClose: () => void;
    onConfirm: () => void;
    isCreating: boolean;
    publishConsentReason: string | null;
}

function PropertyPublishDialog({ listing, options, onOptionsChange, onClose, onConfirm, isCreating, publishConsentReason }: PropertyPublishDialogProps) {
    const draft = listing.propertyDraft;
    if (!draft) return null;
    const audit = listing.auditTranslations?.pl?.auditData || listing.auditData;
    const auditPrice = parseCurrencyValue(audit?.estimatedSalePrice);
    const showcase = listing.showcaseOfferTranslations?.pl || listing.showcaseOffer;
    const imageCount = Array.from(new Set([draft.image, ...(draft.images || [])].filter(Boolean))).length;
    const englishReady = Boolean(listing.showcaseOfferTranslations?.en);
    const readyToPublish = Boolean(draft.title && draft.location && (draft.price || auditPrice) && draft.sqft && imageCount);
    const checks: Array<[string, boolean]> = [
        ['Tytuł i profesjonalny opis', Boolean(showcase?.title && showcase.description)],
        ['Cena sprzedaży', Boolean(draft.price || auditPrice)],
        ['Lokalizacja i parametry', Boolean(draft.location && draft.sqft && draft.beds)],
        [`Zdjęcia (${imageCount})`, imageCount > 0],
        ['Wersja angielska', englishReady],
        ['SEO i adres oferty', true],
    ];

    return <div className="property-publish-dialog" role="dialog" aria-modal="true" aria-labelledby="property-publish-title">
        <section>
            <header><div><span>PRZYGOTOWANIE OFERTY</span><h2 id="property-publish-title">Utwórz ofertę na stronie</h2><p>Sprawdź dane, wybierz cenę oraz zdecyduj, czy oferta ma być od razu widoczna dla klientów.</p></div><button type="button" aria-label="Zamknij" onClick={onClose} disabled={isCreating}><X size={20} /></button></header>
            <div className="property-publish-dialog__summary"><div><small>Tytuł</small><strong>{showcase?.title || draft.title}</strong></div><div><small>Zdjęcia</small><strong>{imageCount || 'Brak'}</strong></div><div><small>Języki</small><strong>{englishReady ? 'PL + EN' : 'PL'}</strong></div></div>
            {listing.activePropertyId && <fieldset><legend>Powiązana oferta na stronie</legend><button type="button" aria-pressed={options.propertyMode === 'update'} onClick={() => onOptionsChange({ ...options, propertyMode: 'update' })}><span>Zaktualizuj istniejącą</span><strong>Bez tworzenia duplikatu</strong></button><button type="button" aria-pressed={options.propertyMode === 'new'} onClick={() => onOptionsChange({ ...options, propertyMode: 'new' })}><span>Utwórz nową wersję</span><strong>Oddzielna oferta na stronie</strong></button></fieldset>}
            <fieldset><legend>Cena na stronie</legend><button type="button" aria-pressed={options.priceMode === 'audit'} disabled={!auditPrice} onClick={() => onOptionsChange({ ...options, priceMode: 'audit' })}><span>Rekomendacja audytu</span><strong>{auditPrice ? `${auditPrice.toLocaleString('pl-PL')} zł` : 'Brak estymacji'}</strong></button><button type="button" aria-pressed={options.priceMode === 'current'} disabled={!draft.price} onClick={() => onOptionsChange({ ...options, priceMode: 'current' })}><span>Obecna cena</span><strong>{draft.price ? `${draft.price.toLocaleString('pl-PL')} zł` : 'Brak ceny'}</strong></button></fieldset>
            <fieldset><legend>Sposób utworzenia</legend><button type="button" aria-pressed={!options.publishNow} onClick={() => onOptionsChange({ ...options, publishNow: false })}><span>Wersja robocza</span><strong>Najpierw końcowa edycja</strong></button><button type="button" aria-pressed={options.publishNow} disabled={!readyToPublish || Boolean(publishConsentReason)} onClick={() => onOptionsChange({ ...options, publishNow: true })}><span>Opublikuj od razu</span><strong>{publishConsentReason ? 'Najpierw zgoda na stronę' : readyToPublish ? 'Widoczna dla klientów' : 'Uzupełnij wymagane dane'}</strong></button></fieldset>
            <div className="property-publish-dialog__checklist"><h3>Kontrola kompletności</h3><div>{checks.map(([label, ready]) => <span key={label} className={ready ? 'is-ready' : ''}><i>{ready ? '✓' : '!'}</i>{label}</span>)}</div></div>
            {publishConsentReason && <p className="property-publish-dialog__warning">{publishConsentReason} Szkic można zapisać. Publikacja (widoczna na stronie) jest zablokowana.</p>}
            {options.publishNow && !readyToPublish && <p className="property-publish-dialog__warning">Publikacja wymaga tytułu, lokalizacji, ceny, metrażu i co najmniej jednego zdjęcia. Możesz utworzyć wersję roboczą i uzupełnić te dane później.</p>}
            <footer><button type="button" onClick={onClose} disabled={isCreating}>Anuluj</button><button type="button" className="is-primary" onClick={onConfirm} disabled={isCreating || options.publishNow && !readyToPublish}>{isCreating ? 'Zapisuję ofertę…' : options.propertyMode === 'update' ? options.publishNow ? 'Zaktualizuj i opublikuj' : 'Zaktualizuj ofertę' : options.publishNow ? 'Utwórz i opublikuj' : 'Utwórz wersję roboczą'}</button></footer>
        </section>
    </div>;
}

interface ShowcaseOfferPreviewProps {
    listing: PropertyLead;
    onClose: () => void;
    onRegenerate: () => void;
    onPublish: () => void;
    onOpenExisting?: () => void;
    isGenerating: boolean;
    isPublishing: boolean;
}

function ShowcaseOfferPreview({ listing, onClose, onRegenerate, onPublish, onOpenExisting, isGenerating, isPublishing }: ShowcaseOfferPreviewProps) {
    const [showcaseLanguage, setShowcaseLanguage] = useState<AuditLanguage>('pl');
    const offer = listing.showcaseOfferTranslations?.[showcaseLanguage] || (showcaseLanguage === 'pl' ? listing.showcaseOffer : undefined);
    if (!offer) return null;
    const hasEnglishVersion = Boolean(listing.showcaseOfferTranslations?.en);
    const copy = showcaseLanguage === 'pl' ? {
        version: 'DOMIZ HOMES · WERSJA POKAZOWA', preview: 'Tak może wyglądać profesjonalna oferta', pdf: 'Zapisz PDF', regenerate: 'Wygeneruj ponownie', generating: 'Generuję...', create: 'Utwórz ofertę na stronie', update: 'Wygeneruj / zaktualizuj ofertę', open: 'Otwórz obecną ofertę', creating: 'Tworzę ofertę...', close: 'Zamknij podgląd', rooms: 'pokoje', floor: 'piętro', plannedPhoto: 'PLANOWANE ZDJĘCIE', prepared: 'OFERTA PRZYGOTOWANA PRZEZ DOMIZ HOMES', locationFallback: 'Lokalizacja do potwierdzenia', priceFallback: 'Cena do ustalenia', estimatedPrice: 'SZACOWANA CENA SPRZEDAŻY PO ZMIANACH', currentPrice: 'Obecna cena ogłoszenia', forecast: 'PROGNOZA WARTOŚCI', forecastTitle: 'Potencjał sprzedaży po profesjonalnym przygotowaniu', range: 'Realistyczny przedział', time: 'Szacowany czas sprzedaży', confidence: 'Poziom pewności', forecastDisclaimer: 'To orientacyjna estymacja handlowa z audytu, a nie operat szacunkowy. Cenę należy potwierdzić analizą porównawczą przed prezentacją właścicielowi.', about: 'O NIERUCHOMOŚCI', highlights: 'NAJWAŻNIEJSZE ATUTY', agent: 'OPIEKUN OFERTY', agentText: 'Profesjonalne przygotowanie i prezentacja nieruchomości.', shootPlan: 'PLAN PROFESJONALNEJ SESJI', shootTitle: 'Zdjęcia, które zbudują tę ofertę', shootIntro: 'Każdy kadr ma konkretną rolę w prezentacji nieruchomości. Placeholdery pokazują właścicielowi plan materiału, który powstanie po rozpoczęciu współpracy.', disclaimer: 'Materiał koncepcyjny przygotowany na podstawie audytu. Treść i parametry wymagają ostatecznej akceptacji właściciela.', generated: 'Wygenerowano', locale: 'pl-PL', englishMissing: 'Wygeneruj ofertę ponownie, aby dodać wersję angielską.',
    } : {
        version: 'DOMIZ HOMES · SHOWCASE VERSION', preview: 'This is how a professional listing could look', pdf: 'Save PDF', regenerate: 'Regenerate', generating: 'Generating...', create: 'Create listing on website', update: 'Generate / update listing', open: 'Open current listing', creating: 'Creating listing...', close: 'Close preview', rooms: 'rooms', floor: 'floor', plannedPhoto: 'PLANNED PHOTO', prepared: 'LISTING PREPARED BY DOMIZ HOMES', locationFallback: 'Location to be confirmed', priceFallback: 'Price to be agreed', estimatedPrice: 'ESTIMATED SALE PRICE AFTER IMPROVEMENTS', currentPrice: 'Current asking price', forecast: 'VALUE FORECAST', forecastTitle: 'Sale potential after professional preparation', range: 'Realistic range', time: 'Estimated time to sell', confidence: 'Confidence level', forecastDisclaimer: 'This is an indicative commercial estimate from the audit, not a formal valuation. Confirm the price with a comparative market analysis before presenting it to the owner.', about: 'ABOUT THE PROPERTY', highlights: 'KEY HIGHLIGHTS', agent: 'LISTING AGENT', agentText: 'Professional preparation and presentation of the property.', shootPlan: 'PROFESSIONAL PHOTO SHOOT PLAN', shootTitle: 'The photos that will build this listing', shootIntro: 'Every frame has a specific role in presenting the property. The placeholders show the owner the visual material planned after the cooperation begins.', disclaimer: 'Concept material prepared from the audit. The content and property details require final approval by the owner.', generated: 'Generated', locale: 'en-GB', englishMissing: '',
    };
    const localizedAudit = listing.auditTranslations?.[showcaseLanguage]?.auditData || (showcaseLanguage === 'pl' ? listing.auditData : undefined);
    const fallbackAudit = listing.auditTranslations?.pl?.auditData || listing.auditData;
    const estimatedSalePrice = localizedAudit?.estimatedSalePrice || fallbackAudit?.estimatedSalePrice;
    const estimatedSalePriceRange = localizedAudit?.estimatedSalePriceRange || fallbackAudit?.estimatedSalePriceRange;
    const estimatedTimeToSell = localizedAudit?.estimatedTimeToSell || fallbackAudit?.estimatedTimeToSell;
    const estimateConfidence = localizedAudit?.estimateConfidence || fallbackAudit?.estimateConfidence;
    const estimateRationale = localizedAudit?.estimateRationale;
    const fallbackPhotoTitles = showcaseLanguage === 'pl'
        ? ['Główne ujęcie nieruchomości', 'Strefa dzienna', 'Kuchnia i funkcjonalny układ', 'Sypialnia lub dodatkowy pokój', 'Lokalizacja i otoczenie']
        : ['Main property view', 'Living area', 'Kitchen and functional layout', 'Bedroom or additional room', 'Location and surroundings'];
    const fallbackPhotoDescriptions = showcaseLanguage === 'pl'
        ? [
            'Szeroki, jasny kadr otwierający prezentację i pokazujący najważniejszy atut nieruchomości.',
            'Uporządkowane ujęcie strefy dziennej, pokazujące proporcje pomieszczenia i naturalne światło.',
            'Kadr prezentujący układ kuchni, przestrzeń roboczą oraz jej połączenie z pozostałą częścią mieszkania.',
            'Zdjęcie pokazujące skalę, ustawność i możliwy sposób wykorzystania prywatnej części nieruchomości.',
            'Ujęcie budynku lub najbliższego otoczenia, które wzmacnia kontekst lokalizacji i codzienną wygodę.',
        ]
        : [
            'A wide, bright opening frame presenting the property and its most important confirmed advantage.',
            'A clean view of the living area showing the room proportions and available natural light.',
            'A frame presenting the kitchen layout, workspace and its connection with the rest of the property.',
            'A photo showing the scale, flexibility and possible use of the property’s private area.',
            'A view of the building or immediate surroundings that provides location context and everyday convenience.',
        ];
    const presentationPhotos: ShowcasePhotoPlaceholder[] = [...offer.photoPlaceholders];
    const auditPhotoPlan = localizedAudit?.photoPlan || fallbackAudit?.photoPlan || [];
    auditPhotoPlan.forEach((description, index) => {
        if (presentationPhotos.length >= 5 || presentationPhotos.some((photo) => photo.description === description)) return;
        const position = presentationPhotos.length;
        presentationPhotos.push({ id: `audit-${index}`, title: fallbackPhotoTitles[position], description });
    });
    while (presentationPhotos.length < 5) {
        const position = presentationPhotos.length;
        presentationPhotos.push({ id: `fallback-${position}`, title: fallbackPhotoTitles[position], description: fallbackPhotoDescriptions[position] });
    }
    const galleryPhotos = presentationPhotos.slice(0, 5);
    const facts = [listing.rooms ? `${listing.rooms} ${copy.rooms}` : '', listing.areaM2 ? `${listing.areaM2} m²` : '', listing.sourceDetails?.floor ? `${copy.floor} ${listing.sourceDetails.floor}` : ''].filter(Boolean);
    const saveAsPdf = () => {
        const previousTitle = document.title;
        const cleanup = () => { document.body.classList.remove('showcase-print-mode'); document.title = previousTitle; };
        document.title = `domiz-homes-showcase-${showcaseLanguage}-${(listing.title || 'property').replace(/\s+/g, '-').toLowerCase()}`;
        document.body.classList.add('showcase-print-mode');
        window.addEventListener('afterprint', cleanup, { once: true });
        window.print();
        window.setTimeout(cleanup, 10000);
    };
    return <div className="showcase-preview-shell" role="dialog" aria-modal="true" aria-labelledby="showcase-offer-title">
        <div className="showcase-preview-toolbar">
            <div><span>{copy.version}</span><strong>{copy.preview}</strong></div>
            <div><div className="showcase-language-switch" role="group" aria-label="Showcase language"><button type="button" className={showcaseLanguage === 'pl' ? 'is-active' : ''} onClick={() => setShowcaseLanguage('pl')}>PL</button><button type="button" className={showcaseLanguage === 'en' ? 'is-active' : ''} onClick={() => setShowcaseLanguage('en')} disabled={!hasEnglishVersion} title={!hasEnglishVersion ? copy.englishMissing : undefined}>EN</button></div><button type="button" onClick={saveAsPdf}><Download size={17} /> {copy.pdf}</button><button type="button" onClick={onRegenerate} disabled={isGenerating}><RefreshCw size={17} /> {isGenerating ? copy.generating : copy.regenerate}</button>{listing.activePropertyId && onOpenExisting && <button type="button" onClick={onOpenExisting}>{copy.open}</button>}<button type="button" className="showcase-preview-toolbar__publish" onClick={onPublish} disabled={isPublishing}>{isPublishing ? copy.creating : listing.activePropertyId ? copy.update : copy.create}</button><button type="button" className="showcase-preview-toolbar__close" aria-label={copy.close} onClick={onClose}><X size={20} /></button></div>
        </div>
        <main id="showcase-offer-print" className="showcase-offer">
            <section className="showcase-offer__gallery" aria-label={copy.shootPlan}>
                {galleryPhotos.map((photo, index) => <article key={photo.id} className={index === 0 ? 'showcase-photo showcase-photo--hero' : 'showcase-photo'}><Camera size={index === 0 ? 34 : 25} /><span>{copy.plannedPhoto} {String(index + 1).padStart(2, '0')}</span><h3>{photo.title}</h3><p>{photo.description}</p></article>)}
            </section>
            <div className="showcase-offer__content">
                <header className="showcase-offer__header"><div><span>{copy.prepared}</span><h1 id="showcase-offer-title">{offer.title}</h1><p>{offer.subtitle}</p><div className="showcase-offer__location"><MapPin size={17} /> {listing.location || copy.locationFallback}</div></div><div className="showcase-offer__price"><span className="showcase-offer__price-label">{estimatedSalePrice ? copy.estimatedPrice : copy.currentPrice}</span><strong>{estimatedSalePrice || listing.price || copy.priceFallback}</strong>{estimatedSalePriceRange && <span>{copy.range}: {estimatedSalePriceRange}</span>}{estimatedSalePrice && listing.price && <small>{copy.currentPrice}: <b>{listing.price}</b></small>}</div></header>
                {facts.length > 0 && <div className="showcase-offer__facts">{facts.map((fact) => <span key={fact}>{fact}</span>)}</div>}
                {estimatedSalePrice && <section className="showcase-offer__forecast"><div><span>{copy.forecast}</span><h2>{copy.forecastTitle}</h2></div><div className="showcase-offer__forecast-metrics"><article><span>{copy.estimatedPrice}</span><strong>{estimatedSalePrice}</strong></article>{estimatedSalePriceRange && <article><span>{copy.range}</span><strong>{estimatedSalePriceRange}</strong></article>}{estimatedTimeToSell && <article><span>{copy.time}</span><strong>{estimatedTimeToSell}</strong></article>}{estimateConfidence && <article><span>{copy.confidence}</span><strong>{estimateConfidence}</strong></article>}</div>{estimateRationale && <p>{estimateRationale}</p>}<small>{copy.forecastDisclaimer}</small></section>}
                <div className="showcase-offer__body"><article><span>{copy.about}</span><div>{offer.description.split(/\n+/).filter(Boolean).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></article><aside><span>{copy.highlights}</span><ul>{offer.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul><div className="showcase-offer__agent"><small>{copy.agent}</small><strong>{listing.assignee || listing.propertyDraft?.agent.name || 'Domiz Homes'}</strong><p>{copy.agentText}</p></div></aside></div>
                <section className="showcase-offer__shoot-plan"><div><span>{copy.shootPlan}</span><h2>{copy.shootTitle}</h2><p>{copy.shootIntro}</p></div><div>{presentationPhotos.map((photo, index) => <article key={photo.id}><span>{String(index + 1).padStart(2, '0')}</span><div><h3>{photo.title}</h3><p>{photo.description}</p></div></article>)}</div></section>
                <footer><span>{copy.disclaimer}</span><span>{copy.generated} {new Date(offer.generatedAt).toLocaleString(copy.locale)}</span></footer>
            </div>
        </main>
    </div>;
}

function AdvancedAuditPanel({ audit, versions = [], language = 'pl' }: { audit?: AuditDraft; versions?: AuditVersion[]; language?: AuditLanguage }) {
    if (!audit || (!audit.scores && !audit.strengths?.length && !audit.quickWins?.length)) return null;
    const copy = language === 'pl' ? {
        scores: ['Zdjęcia', 'Opis', 'Cena', 'Pozycjonowanie', 'Kompletność', 'Konwersja'], decision: 'PODSUMOWANIE DECYZYJNE', title: 'Zaawansowany audyt oferty', verdict: 'Werdykt audytu', reliability: 'Wiarygodność analizy', forecast: 'PROGNOZA PO WDROŻENIU ZMIAN', saleResult: 'Szacowany wynik sprzedaży', confidence: 'Pewność', likelyPrice: 'Najbardziej prawdopodobna cena', range: 'Realistyczny przedział', time: 'Szacowany czas sprzedaży', assumptions: 'Założenia prognozy', disclaimer: 'Estymacja orientacyjna, nie operat szacunkowy. Przed prezentacją właścicielowi należy potwierdzić ją analizą porównawczą rynku.', diagnosis: 'Diagnoza obecnej oferty', diagnosisHint: 'Co działa, co ogranicza wynik i jak wygląda jakość prezentacji.', strengths: 'Mocne strony', risks: 'Ryzyka', missing: 'Braki do uzupełnienia', focus: 'Najważniejszy obszar', strategy: 'Strategia sprzedaży', strategyHint: 'Komu sprzedajemy, jak pozycjonujemy ofertę i jak uzasadniamy wartość.', buyer: 'Profil kupującego', objections: 'Możliwe obiekcje', pricePosition: 'Cena i wyróżnienie', pricePresentation: 'Prezentacja ceny:', differentiation: 'Strategia wyróżnienia:', headline: 'Proponowany tytuł', contactAngle: 'Kąt pierwszego kontaktu', implementation: 'Plan wdrożenia', implementationHint: 'Konkretne działania potrzebne do przygotowania i uruchomienia sprzedaży.', quickWins: 'Szybkie usprawnienia', photos: 'Plan zdjęć i materiałów', channels: 'Kanały promocji', questions: 'Pytania do właściciela', sevenDays: 'Plan pierwszych 7 dni', next: 'REKOMENDOWANY KOLEJNY KROK', history: 'Historia audytów', last: 'ostatni', locale: 'pl-PL',
    } : {
        scores: ['Photos', 'Description', 'Price', 'Positioning', 'Completeness', 'Conversion'], decision: 'EXECUTIVE SUMMARY', title: 'Advanced listing audit', verdict: 'Audit verdict', reliability: 'Analysis reliability', forecast: 'FORECAST AFTER IMPLEMENTING CHANGES', saleResult: 'Estimated sale outcome', confidence: 'Confidence', likelyPrice: 'Most likely price', range: 'Realistic range', time: 'Estimated time to sell', assumptions: 'Forecast assumptions', disclaimer: 'This is an indicative commercial estimate, not a formal valuation. Confirm it with a comparative market analysis before presenting it to the owner.', diagnosis: 'Current listing diagnosis', diagnosisHint: 'What works, what limits performance, and how the property is currently presented.', strengths: 'Strengths', risks: 'Risks', missing: 'Missing information', focus: 'Primary focus area', strategy: 'Sales strategy', strategyHint: 'Who the target buyer is, how to position the listing, and how to communicate its value.', buyer: 'Buyer profile', objections: 'Potential objections', pricePosition: 'Price and differentiation', pricePresentation: 'Price presentation:', differentiation: 'Differentiation strategy:', headline: 'Proposed headline', contactAngle: 'First-contact angle', implementation: 'Implementation plan', implementationHint: 'Specific actions required to prepare and launch the sale.', quickWins: 'Quick wins', photos: 'Photo and content plan', channels: 'Marketing channels', questions: 'Questions for the owner', sevenDays: 'First 7-day plan', next: 'RECOMMENDED NEXT STEP', history: 'Audit history', last: 'latest', locale: 'en-GB',
    };
    const scoreItems: Array<[string, number]> = [
        [copy.scores[0], audit.scores?.photos || 0],
        [copy.scores[1], audit.scores?.description || 0],
        [copy.scores[2], audit.scores?.price || 0],
        [copy.scores[3], audit.scores?.positioning || 0],
        ...(typeof audit.scores?.completeness === 'number' ? [[copy.scores[4], audit.scores.completeness] as [string, number]] : []),
        ...(typeof audit.scores?.conversion === 'number' ? [[copy.scores[5], audit.scores.conversion] as [string, number]] : []),
    ];
    return <section className="advanced-audit">
        <div className="advanced-audit__heading"><div><span>{copy.decision}</span><h3>{copy.title}</h3></div><div className="advanced-audit__score"><strong>{audit.overallScore || 0}</strong><span>/100</span></div></div>
        {(audit.auditVerdict || audit.dataQualityNote) && <div className="advanced-audit__verdict">{audit.auditVerdict && <div><span>{copy.verdict}</span><strong>{audit.auditVerdict}</strong></div>}{audit.dataQualityNote && <div><span>{copy.reliability}</span><p>{audit.dataQualityNote}</p></div>}</div>}
        {(audit.estimatedSalePrice || audit.estimatedSalePriceRange) && <section className="advanced-audit__sale-forecast"><div className="advanced-audit__sale-forecast-heading"><div><span>{copy.forecast}</span><h4>{copy.saleResult}</h4></div>{audit.estimateConfidence && <div className="advanced-audit__confidence">{copy.confidence}: <strong>{audit.estimateConfidence}</strong></div>}</div><div className="advanced-audit__sale-metrics">{audit.estimatedSalePrice && <div><span>{copy.likelyPrice}</span><strong>{audit.estimatedSalePrice}</strong></div>}{audit.estimatedSalePriceRange && <div><span>{copy.range}</span><strong>{audit.estimatedSalePriceRange}</strong></div>}{audit.estimatedTimeToSell && <div><span>{copy.time}</span><strong>{audit.estimatedTimeToSell}</strong></div>}</div>{audit.estimateRationale && <p className="advanced-audit__sale-rationale">{audit.estimateRationale}</p>}{audit.estimateAssumptions?.length ? <details className="advanced-audit__forecast-details"><summary>{copy.assumptions}</summary><ul>{audit.estimateAssumptions.map((item) => <li key={item}>{item}</li>)}</ul></details> : null}<small>{copy.disclaimer}</small></section>}

        <div className="advanced-audit__phase"><div className="advanced-audit__phase-title"><span>01</span><div><b>{copy.diagnosis}</b><small>{copy.diagnosisHint}</small></div></div><div className="advanced-audit__scores">{scoreItems.map(([label, value]) => <div key={label}><div><span>{label}</span><strong>{value}</strong></div><div className="advanced-audit__bar"><i style={{ width: `${value}%` }} /></div></div>)}</div><div className="advanced-audit__columns"><div><h4>{copy.strengths}</h4><ul>{audit.strengths?.map((item) => <li key={item}>{item}</li>)}</ul></div><div><h4>{copy.risks}</h4><ul>{audit.risks?.map((item) => <li key={item}>{item}</li>)}</ul></div>{audit.missingInformation?.length ? <div><h4>{copy.missing}</h4><ul>{audit.missingInformation.map((item) => <li key={item}>{item}</li>)}</ul></div> : <div><h4>{copy.focus}</h4><p>{audit.actionPlan}</p></div>}</div></div>

        <div className="advanced-audit__phase"><div className="advanced-audit__phase-title"><span>02</span><div><b>{copy.strategy}</b><small>{copy.strategyHint}</small></div></div><div className="advanced-audit__deep-grid">{(audit.buyerPersona || audit.buyerObjections?.length) && <section><h5>{copy.buyer}</h5>{audit.buyerPersona && <p>{audit.buyerPersona}</p>}{audit.buyerObjections?.length ? <><b>{copy.objections}</b><ul>{audit.buyerObjections.map((item) => <li key={item}>{item}</li>)}</ul></> : null}</section>}{(audit.pricingRecommendation || audit.differentiationStrategy) && <section><h5>{copy.pricePosition}</h5>{audit.pricingRecommendation && <p><b>{copy.pricePresentation}</b> {audit.pricingRecommendation}</p>}{audit.differentiationStrategy && <p><b>{copy.differentiation}</b> {audit.differentiationStrategy}</p>}</section>}</div>{(audit.recommendedHeadline || audit.contactAngle) && <div className="advanced-audit__strategy">{audit.recommendedHeadline && <div><span>{copy.headline}</span><strong>{audit.recommendedHeadline}</strong></div>}{audit.contactAngle && <div><span>{copy.contactAngle}</span><p>{audit.contactAngle}</p></div>}</div>}</div>

        <div className="advanced-audit__phase"><div className="advanced-audit__phase-title"><span>03</span><div><b>{copy.implementation}</b><small>{copy.implementationHint}</small></div></div><div className="advanced-audit__deep-grid">{audit.quickWins?.length ? <section><h5>{copy.quickWins}</h5><ol>{audit.quickWins.map((item) => <li key={item}>{item}</li>)}</ol></section> : null}{audit.photoPlan?.length ? <section><h5>{copy.photos}</h5><ol>{audit.photoPlan.map((item) => <li key={item}>{item}</li>)}</ol></section> : null}{audit.marketingChannels?.length ? <section><h5>{copy.channels}</h5><ul>{audit.marketingChannels.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}{audit.contactQuestions?.length ? <section><h5>{copy.questions}</h5><ol>{audit.contactQuestions.map((item) => <li key={item}>{item}</li>)}</ol></section> : null}</div>{audit.sevenDayPlan?.length ? <div className="advanced-audit__timeline"><h5>{copy.sevenDays}</h5><div>{audit.sevenDayPlan.map((item, index) => <div key={`${index}-${item}`}><span>{index + 1}</span><p>{item}</p></div>)}</div></div> : null}{audit.recommendedNextStep && <div className="advanced-audit__next-step"><span>{copy.next}</span><strong>{audit.recommendedNextStep}</strong></div>}</div>

        {versions.length > 0 && <div className="advanced-audit__versions">{copy.history}: <strong>{versions.length}</strong> · {copy.last} {new Date(versions[versions.length - 1].generatedAt).toLocaleString(copy.locale)}</div>}
    </section>;
}

const buildVideoScript = (property: Property, language: 'pl' | 'en') => {
    const facts = [
        property.sqft ? `${property.sqft} m²` : '',
        property.beds ? language === 'pl' ? `${property.beds} pokoje` : `${property.beds} rooms` : '',
        property.location,
    ].filter(Boolean).join(', ');
    const highlights = (language === 'en' ? property.featuresEn : property.features)?.slice(0, 4).join(', ') || '';
    if (language === 'en') return `Looking for a property that stands out from the very first moment?\n\nDiscover ${property.title}, located in ${property.location}. It offers ${facts}. ${highlights ? `Its key advantages include ${highlights}.` : ''}\n\nThe asking price is ${property.price.toLocaleString('en-GB')} PLN. This is a home worth seeing not only in photos, but in person.\n\nContact Domiz Homes and arrange your private viewing.`;
    return `Szukasz nieruchomości, która robi wrażenie od pierwszej chwili?\n\nPoznaj ofertę: ${property.title}, położoną w lokalizacji ${property.location}. Nieruchomość oferuje ${facts}. ${highlights ? `Jej najważniejsze atuty to: ${highlights}.` : ''}\n\nCena ofertowa wynosi ${property.price.toLocaleString('pl-PL')} zł. To miejsce warto zobaczyć nie tylko na zdjęciach, ale przede wszystkim na żywo.\n\nSkontaktuj się z Domiz Homes i umów prywatną prezentację.`;
};

const buildHeyGenPrompt = (property: Property, script: string, language: 'pl' | 'en', orientation: 'portrait' | 'landscape', duration: number, tone: string) => `${language === 'pl' ? 'Stwórz film promocyjny nieruchomości w języku polskim.' : 'Create a property promotional video in English.'}
Target duration: ${duration} seconds. Orientation: ${orientation === 'portrait' ? 'portrait 9:16 for Instagram Reels, TikTok and YouTube Shorts' : 'landscape 16:9 for website and YouTube'}.
Tone: ${tone}. Use a confident, natural real-estate presenter and premium pacing.

NARRATION SCRIPT:
${script}

PROPERTY VISUALS:
Use the property photos as the primary B-roll. Begin with the strongest exterior or living-room image, then show the interior, key details and location benefits. Use subtle motion on still photos. Never invent features that are not present in the source material.

CRITICAL ON-SCREEN TEXT:
- ${property.title}
- ${property.location}
- ${property.price.toLocaleString(language === 'pl' ? 'pl-PL' : 'en-GB')} PLN
- ${property.sqft} m²
- Domiz Homes
- ${language === 'pl' ? 'Umów prezentację' : 'Book a viewing'}

This script is a concept and theme to convey — not a verbatim transcript. You have full creative freedom to expand, elaborate, add examples, and fill the duration naturally. Do not pad with silence or pauses.

STYLE — VELVET STANDARD: Black, white, warm ivory and one accent: gold #c9a84c. Thin ALL CAPS, wide spacing, generous negative space. Slow elegant cross-dissolves. Use motion graphics for property facts and CTA, property photos for B-roll, and a clean premium intro and outro.`;

function VideoStudio({ properties, initialPropertyId }: { properties: Property[]; initialPropertyId: number | null }) {
    const [propertyId, setPropertyId] = useState<number | null>(initialPropertyId || properties[0]?.id || null);
    const [language, setLanguage] = useState<'pl' | 'en'>('pl');
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
    const [duration, setDuration] = useState(45);
    const [tone, setTone] = useState('premium, elegancki i wiarygodny');
    const [script, setScript] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const [savingProject, setSavingProject] = useState(false);
    const [savingVideo, setSavingVideo] = useState(false);
    const [generatingVideo, setGeneratingVideo] = useState(false);
    const [videoJob, setVideoJob] = useState<{ projectId: string; videoId?: string; status: string; failureMessage?: string } | null>(null);
    const selected = properties.find((property) => property.id === propertyId) || properties[0];

    useEffect(() => {
        if (initialPropertyId && properties.some((property) => property.id === initialPropertyId)) setPropertyId(initialPropertyId);
    }, [initialPropertyId, properties]);

    useEffect(() => {
        if (!selected) return;
        setScript(buildVideoScript(selected, language));
        setVideoUrl(selected.promotionalVideoUrl || '');
    }, [selected?.id, language]);

    useEffect(() => {
        if (!selected) return;
        let active = true;
        setVideoJob(null);
        getDocs(query(collection(db, 'videoProjects'), where('propertyId', '==', selected.id)))
            .then((existingProjects) => {
                if (!active) return;
                const activeProject = existingProjects.docs
                    .map((projectSnapshot) => ({ projectId: projectSnapshot.id, ...projectSnapshot.data() } as { projectId: string; videoId?: string; status?: string; failureMessage?: string }))
                    .find((project) => ['queued', 'starting', 'generating', 'processing', 'pending'].includes(project.status || ''));
                if (activeProject) setVideoJob({ projectId: activeProject.projectId, videoId: activeProject.videoId, status: activeProject.status || 'queued', failureMessage: activeProject.failureMessage });
            })
            .catch((error) => console.error('Błąd wznowienia statusu filmu HeyGen:', error));
        return () => { active = false; };
    }, [selected?.id]);

    useEffect(() => {
        if (!videoJob?.projectId) return;
        return onSnapshot(doc(db, 'videoProjects', videoJob.projectId), (snapshot) => {
            if (!snapshot.exists()) return;
            const data = snapshot.data();
            setVideoJob((current) => current ? {
                ...current,
                videoId: data.videoId,
                status: data.status || 'queued',
                failureMessage: data.failureMessage,
            } : current);
            if (data.videoUrl) setVideoUrl(data.videoUrl);
        }, (error) => {
            console.error('Błąd odczytu statusu filmu HeyGen:', error);
        });
    }, [videoJob?.projectId]);

    if (!selected) return <div className="glass-panel video-studio video-studio--empty"><h2>Studio filmów AI</h2><p>Dodaj ofertę, aby przygotować pierwszy film promocyjny.</p></div>;

    const prompt = buildHeyGenPrompt(selected, script, language, orientation, duration, tone);
    const copyPrompt = async () => {
        await navigator.clipboard.writeText(prompt);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2200);
    };
    const saveProject = async () => {
        setSavingProject(true);
        try {
            await addDoc(collection(db, 'videoProjects'), { propertyId: selected.id, propertyTitle: selected.title, language, orientation, duration, tone, script, prompt, status: 'brief_ready', createdAt: new Date().toISOString(), provider: 'HeyGen' });
            alert('Projekt filmu został zapisany.');
        } catch (error) {
            console.error('Błąd zapisu projektu filmu:', error);
            alert('Nie udało się zapisać projektu filmu.');
        } finally { setSavingProject(false); }
    };
    const openHeyGen = async () => {
        window.open('https://app.heygen.com/video-agent', '_blank', 'noopener,noreferrer');
        await copyPrompt();
    };
    const generateInHeyGen = async () => {
        if (!script.trim()) { alert('Uzupełnij scenariusz filmu.'); return; }
        setGeneratingVideo(true);
        try {
            const existingProjects = await getDocs(query(collection(db, 'videoProjects'), where('propertyId', '==', selected.id)));
            const activeProject = existingProjects.docs
                .map((projectSnapshot) => ({ projectId: projectSnapshot.id, ...projectSnapshot.data() } as { projectId: string; videoId?: string; status?: string; failureMessage?: string }))
                .find((project) => ['queued', 'starting', 'generating', 'processing', 'pending'].includes(project.status || ''));
            if (activeProject) {
                setVideoJob({ projectId: activeProject.projectId, videoId: activeProject.videoId, status: activeProject.status || 'queued', failureMessage: activeProject.failureMessage });
                alert('Ta oferta ma już film w trakcie generowania. Podłączyłem bieżący status zamiast tworzyć kolejne płatne zlecenie.');
                return;
            }
            const estimatedCost = duration === 30 ? 'około 1 USD' : duration === 45 ? 'około 1,50 USD' : 'około 2 USD';
            if (!window.confirm(`Rozpocząć generowanie filmu w HeyGen? Szacowany koszt: ${estimatedCost}.`)) return;
            const reference = await addDoc(collection(db, 'videoProjects'), {
                propertyId: selected.id,
                propertyTitle: selected.title,
                language,
                orientation,
                duration,
                tone,
                script,
                prompt,
                status: 'queued',
                provider: 'HeyGen',
                createdAt: new Date().toISOString(),
            });
            setVideoJob({ projectId: reference.id, status: 'queued' });
        } catch (error: any) {
            console.error('Błąd generowania filmu HeyGen:', error);
            alert(error?.message || 'Nie udało się uruchomić generowania filmu.');
        } finally { setGeneratingVideo(false); }
    };
    const saveVideoLink = async () => {
        const normalized = videoUrl.trim();
        if (!/^https:\/\//i.test(normalized)) { alert('Wklej poprawny link HTTPS do filmu.'); return; }
        setSavingVideo(true);
        try {
            await updateDoc(doc(db, 'properties', selected.id.toString()), { promotionalVideoUrl: normalized, promotionalVideoUpdatedAt: new Date().toISOString() });
            alert('Film został przypisany do oferty.');
        } catch (error) {
            console.error('Błąd zapisu filmu:', error);
            alert('Nie udało się przypisać filmu do oferty.');
        } finally { setSavingVideo(false); }
    };

    return <div className="glass-panel video-studio">
        <header className="video-studio__header"><div><div className="admin-dashboard__eyebrow">HEYGEN × DOMIZ HOMES</div><h2>Studio filmów AI</h2><p>Przygotuj profesjonalny brief i wygeneruj film promocyjny na podstawie danych oraz zdjęć oferty.</p></div><span className="video-studio__connection is-connected">HeyGen połączony bezpiecznie</span></header>
        <div className="video-studio__layout">
            <aside className="video-studio__controls">
                <label>Oferta<select value={selected.id} onChange={(event) => setPropertyId(Number(event.target.value))}>{properties.map((property) => <option key={property.id} value={property.id}>{property.title}</option>)}</select></label>
                <div className="video-studio__property"><img src={selected.image} alt="" /><div><strong>{selected.title}</strong><span>{selected.location}</span><b>{selected.price.toLocaleString('pl-PL')} zł</b></div></div>
                <fieldset><legend>Język filmu</legend><button type="button" aria-pressed={language === 'pl'} onClick={() => setLanguage('pl')}>Polski</button><button type="button" aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>English</button></fieldset>
                <fieldset><legend>Format</legend><button type="button" aria-pressed={orientation === 'portrait'} onClick={() => setOrientation('portrait')}>9:16 Reels</button><button type="button" aria-pressed={orientation === 'landscape'} onClick={() => setOrientation('landscape')}>16:9 WWW</button></fieldset>
                <label>Długość<select value={duration} onChange={(event) => setDuration(Number(event.target.value))}><option value={30}>30 sekund</option><option value={45}>45 sekund</option><option value={60}>60 sekund</option></select></label>
                <label>Ton filmu<input value={tone} onChange={(event) => setTone(event.target.value)} /></label>
            </aside>
            <main className="video-studio__editor">
                <div className="video-studio__editor-heading"><div><span>SCENARIUSZ LEKTORA</span><h3>Gotowy do edycji</h3></div><small>{script.trim().split(/\s+/).filter(Boolean).length} słów · około {Math.max(20, Math.round(script.trim().split(/\s+/).filter(Boolean).length / 2.25))} sek.</small></div>
                <textarea value={script} onChange={(event) => setScript(event.target.value)} rows={13} aria-label="Scenariusz filmu" />
                <div className="video-studio__actions"><button type="button" onClick={() => void saveProject()} disabled={savingProject}>{savingProject ? 'Zapisuję…' : 'Zapisz projekt'}</button><button type="button" onClick={() => void copyPrompt()}>{copied ? 'Brief skopiowany' : 'Kopiuj brief'}</button><button type="button" onClick={() => void openHeyGen()}>Otwórz ręcznie</button><button type="button" className="is-primary" onClick={() => void generateInHeyGen()} disabled={generatingVideo || Boolean(videoJob && !['completed', 'failed', 'cancelled'].includes(videoJob.status))}>{generatingVideo ? 'Sprawdzam…' : videoJob && !['completed', 'failed', 'cancelled'].includes(videoJob.status) ? 'Film jest generowany' : 'Generuj film w HeyGen'}</button></div>
                {videoJob && <section className={`video-studio__job is-${videoJob.status}`}><div><span>{videoJob.status === 'completed' ? 'FILM GOTOWY' : videoJob.status === 'failed' ? 'NIE UDAŁO SIĘ' : videoJob.status === 'queued' ? 'ZLECENIE PRZYJĘTE' : 'HEYGEN PRACUJE'}</span><h3>{videoJob.status === 'completed' ? 'Film został przypisany do oferty' : videoJob.status === 'failed' ? 'Generowanie zatrzymane' : videoJob.status === 'queued' ? 'Zlecenie czeka na rozpoczęcie' : 'Generowanie filmu w toku'}</h3><p>{videoJob.status === 'completed' ? 'Możesz go obejrzeć i wykorzystać w promocji.' : videoJob.status === 'failed' ? videoJob.failureMessage : videoJob.status === 'queued' ? 'Prywatna funkcja Firebase za chwilę przekaże materiały do HeyGen.' : 'Możesz opuścić tę kartę. Status jest sprawdzany automatycznie co minutę.'}</p></div>{!['completed', 'failed'].includes(videoJob.status) && <Loader2 className="animate-spin" size={24} />}</section>}
                <section className="video-studio__result"><div><span>GOTOWY FILM</span><h3>Film przypisany do oferty</h3><p>Po ukończeniu generowania link zapisze się automatycznie. Możesz też wkleić go ręcznie.</p></div>{videoUrl && <video src={videoUrl} controls preload="metadata" poster={selected.promotionalVideoThumbnailUrl} />}
                <div><input type="url" value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="https://app.heygen.com/..." aria-label="Link do filmu HeyGen" /><button type="button" onClick={() => void saveVideoLink()} disabled={savingVideo}>{savingVideo ? 'Zapisuję…' : 'Zapisz link'}</button></div>{(selected.promotionalVideoPageUrl || selected.promotionalVideoUrl) && <a href={selected.promotionalVideoPageUrl || selected.promotionalVideoUrl} target="_blank" rel="noreferrer">Otwórz zapisany film</a>}</section>
            </main>
        </div>
    </div>;
}

function AdminSettingsPanel() {
    const [apiKey, setApiKey] = useState('');
    const [gammaApiKey, setGammaApiKey] = useState('');
    const [googleOAuthClientId, setGoogleOAuthClientId] = useState('');
    const [googleOAuthClientSecret, setGoogleOAuthClientSecret] = useState('');
    const [googleDocsRefreshToken, setGoogleDocsRefreshToken] = useState('');
    const [googleDocsTemplateId, setGoogleDocsTemplateId] = useState('');
    const [saving, setSaving] = useState(false);
    const [loadingSettings, setLoadingSettings] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, "configs", "seo");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setApiKey(data.geminiApiKey || '');
                    setGammaApiKey(data.gammaApiKey || '');
                    setGoogleOAuthClientId(data.googleOAuthClientId || '');
                    setGoogleOAuthClientSecret(data.googleOAuthClientSecret || '');
                    setGoogleDocsRefreshToken(data.googleDocsRefreshToken || '');
                    setGoogleDocsTemplateId(data.googleDocsTemplateId || '');
                }
            } catch (err) {
                console.error("Error loading settings:", err);
            } finally {
                setLoadingSettings(false);
            }
        };
        void fetchSettings();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await setDoc(doc(db, "configs", "seo"), {
                geminiApiKey: apiKey.trim(),
                gammaApiKey: gammaApiKey.trim(),
                googleOAuthClientId: googleOAuthClientId.trim(),
                googleOAuthClientSecret: googleOAuthClientSecret.trim(),
                googleDocsRefreshToken: googleDocsRefreshToken.trim(),
                googleDocsTemplateId: googleDocsTemplateId.trim(),
            }, { merge: true });
            alert("Ustawienia zostały zapisane!");
        } catch (err: any) {
            console.error("Error saving settings:", err);
            alert("Błąd zapisu: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loadingSettings) return <div style={{ padding: '2rem', textAlign: 'center' }}><Loader2 className="animate-spin" /></div>;

    return (
        <form onSubmit={handleSave} className="glass-panel" style={{ padding: '2rem', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 style={{ marginTop: 0 }}>Ustawienia Sztucznej Inteligencji & SEO</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: 0, lineHeight: '1.6' }}>
                Skonfiguruj klucze API do generowania treści SEO i prezentacji Gamma. Umowy Google Docs działają przez service account projektu (OAuth hello@ jest opcjonalny).
            </p>
            
            <div>
                <label style={{ fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>Klucz API Google Gemini</label>
                <input 
                    type="password" 
                    placeholder="Wklej swój klucz API AIzaSy..." 
                    value={apiKey} 
                    onChange={(e) => setApiKey(e.target.value)} 
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--color-border)',
                        fontSize: '1rem',
                        boxSizing: 'border-box'
                    }}
                />
                <small style={{ display: 'block', color: 'var(--color-text-dim)', marginTop: '0.5rem', lineHeight: '1.4' }}>
                    Klucz możesz wygenerować bezpłatnie w serwisie <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>Google AI Studio</a>.
                </small>
            </div>

            <div>
                <label style={{ fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>Klucz API Gamma</label>
                <input
                    type="password"
                    placeholder="skgamma-..."
                    value={gammaApiKey}
                    onChange={(e) => setGammaApiKey(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--color-border)',
                        fontSize: '1rem',
                        boxSizing: 'border-box'
                    }}
                />
                <small style={{ display: 'block', color: 'var(--color-text-dim)', marginTop: '0.5rem', lineHeight: '1.4' }}>
                    Klucz znajdziesz w Gamma: Settings → API key (wymagane konto Pro+). Służy do tworzenia prezentacji proposal.
                </small>
            </div>

            <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
                <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>Google Docs — umowy</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.82rem', margin: '0 0 1rem', lineHeight: 1.5 }}>
                    Workspace blokuje bezpośrednie tworzenie Docs przez service account. Najpewniejszy setup (1×): utwórz pusty Google Doc na <strong>hello@ecm-digital.com</strong>, udostępnij do edycji
                    {' '}<code>domiz-docs@domiz-a6a6c.iam.gserviceaccount.com</code>, wklej ID dokumentu poniżej (fragment URL między <code>/d/</code> a <code>/edit</code>).
                </p>
                <label style={{ fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>ID szablonu Google Docs</label>
                <input type="text" value={googleDocsTemplateId} onChange={(e) => setGoogleDocsTemplateId(e.target.value)} placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', fontSize: '1rem', boxSizing: 'border-box', marginBottom: '0.85rem' }} />
                <label style={{ fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>OAuth Client ID (opcjonalnie)</label>
                <input type="password" value={googleOAuthClientId} onChange={(e) => setGoogleOAuthClientId(e.target.value)} placeholder="xxxx.apps.googleusercontent.com" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', fontSize: '1rem', boxSizing: 'border-box', marginBottom: '0.85rem' }} />
                <label style={{ fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>OAuth Client Secret (opcjonalnie)</label>
                <input type="password" value={googleOAuthClientSecret} onChange={(e) => setGoogleOAuthClientSecret(e.target.value)} placeholder="GOCSPX-..." style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', fontSize: '1rem', boxSizing: 'border-box', marginBottom: '0.85rem' }} />
                <label style={{ fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>Refresh token (opcjonalnie)</label>
                <input type="password" value={googleDocsRefreshToken} onChange={(e) => setGoogleDocsRefreshToken(e.target.value)} placeholder="1//..." style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', fontSize: '1rem', boxSizing: 'border-box' }} />
            </div>

            <button type="submit" className="btn-primary" disabled={saving} style={{ alignSelf: 'flex-start', padding: '0.75rem 1.5rem', justifyContent: 'center' }}>
                {saving ? 'Zapisywanie...' : 'Zapisz Ustawienia'}
            </button>
        </form>
    );
}
