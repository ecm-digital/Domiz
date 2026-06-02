export function createSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/ł/g, 'l')
        .replace(/ś/g, 's')
        .replace(/ć/g, 'c')
        .replace(/ą/g, 'a')
        .replace(/ę/g, 'e')
        .replace(/ń/g, 'n')
        .replace(/ó/g, 'o')
        .replace(/ź/g, 'z')
        .replace(/ż/g, 'z')
        .replace(/[^a-z0-9]+/g, '-') // Usuń wszystko co nie jest literą/cyfrą
        .replace(/^-+|-+$/g, ''); // Usuń myślniki z początku/końca
}
