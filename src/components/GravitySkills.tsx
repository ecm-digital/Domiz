import { useEffect, useRef } from 'react';
import Matter from 'matter-js';

const SKILLS = [
    "Sprzedaż",
    "Wynajem",
    "Wycena",
    "Doradztwo Prawne",
    "Marketing",
    "Home Staging"
];

export const GravitySkills = () => {
    const sceneRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<Matter.Engine | null>(null);
    const renderRef = useRef<Matter.Render | null>(null);
    const runnerRef = useRef<Matter.Runner | null>(null);

    useEffect(() => {
        if (!sceneRef.current) return;

        // Module aliases
        const Engine = Matter.Engine,
            Render = Matter.Render,
            Runner = Matter.Runner,
            Bodies = Matter.Bodies,
            Composite = Matter.Composite,
            Mouse = Matter.Mouse,
            MouseConstraint = Matter.MouseConstraint,
            Events = Matter.Events;

        // Create engine
        const engine = Engine.create();
        engineRef.current = engine;

        const width = sceneRef.current.clientWidth;
        const height = 400; // Fixed height for the section

        // Create renderer
        const render = Render.create({
            element: sceneRef.current,
            engine: engine,
            options: {
                width,
                height,
                background: 'transparent',
                wireframes: false,
                pixelRatio: window.devicePixelRatio,
            }
        });
        renderRef.current = render;

        // Create bodies
        const wallOptions = { isStatic: true, render: { visible: false } };
        // Ground needs to be thick and positioned correctly
        const ground = Bodies.rectangle(width / 2, height + 50, width + 200, 100, wallOptions);
        const leftWall = Bodies.rectangle(-50, height / 2, 100, height * 2, wallOptions);
        const rightWall = Bodies.rectangle(width + 50, height / 2, 100, height * 2, wallOptions);

        // Add specific walls for top to prevent flying too high, but open enough for spawning
        // const ceiling = Bodies.rectangle(width / 2, -1000, width, 50, wallOptions); 

        const skillBodies = SKILLS.map((skill) => {
            const x = Math.random() * (width - 100) + 50;
            const y = Math.random() * -200 - 50; // Spawn closer
            const bodyWidth = skill.length * 15 + 40;
            const body = Bodies.rectangle(x, y, bodyWidth, 50, { // Slightly shorter height
                restitution: 0.5, // Bounciness
                friction: 0.01,   // Slide easily
                frictionAir: 0.02, // Air resistance
                render: {
                    fillStyle: 'rgba(16, 185, 129, 0.1)',
                    strokeStyle: '#34d399',
                    lineWidth: 1
                },
                label: skill
            });
            return body;
        });

        Composite.add(engine.world, [ground, leftWall, rightWall, ...skillBodies]);

        // Add mouse control
        const mouse = Mouse.create(render.canvas);
        const mouseConstraint = MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: { visible: false }
            }
        });

        // Prevent page scrolling when interacting with canvas (optional, but good for immersive feel)
        // mouseConstraint.mouse.element.removeEventListener("mousewheel", mouseConstraint.mouse.mousewheel);
        // mouseConstraint.mouse.element.removeEventListener("DOMMouseScroll", mouseConstraint.mouse.mousewheel);

        // Enable mouse interaction
        render.mouse = mouse;
        Composite.add(engine.world, mouseConstraint);

        // Run the engine
        const runner = Runner.create();
        runnerRef.current = runner;
        Runner.run(runner, engine);
        Render.run(render);

        // Custom rendering for text
        Events.on(render, "afterRender", () => {
            const context = render.context;
            context.font = "600 14px 'Inter', sans-serif";
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillStyle = "#ffffff";

            skillBodies.forEach((body, index) => {
                const { x, y } = body.position;
                const angle = body.angle;

                context.save();
                context.translate(x, y);
                context.rotate(angle);
                // Draw shadow for better readability
                context.shadowColor = "rgba(0,0,0,0.5)";
                context.shadowBlur = 2;
                context.fillText(SKILLS[index], 0, 0);
                context.restore();
            });
        });

        // Resize handler
        const handleResize = () => {
            if (!sceneRef.current || !renderRef.current || !engineRef.current) return;

            const newWidth = sceneRef.current.clientWidth;
            renderRef.current.bounds.max.x = newWidth;
            renderRef.current.options.width = newWidth;
            renderRef.current.canvas.width = newWidth;

            // Update walls positions
            Matter.Body.setPosition(ground, { x: newWidth / 2, y: height + 50 });
            Matter.Body.setPosition(rightWall, { x: newWidth + 50, y: height / 2 });
            // Left wall stays at -50
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            Render.stop(render);
            Runner.stop(runner);
            if (render.canvas) render.canvas.remove();
            Composite.clear(engine.world, false);
            Engine.clear(engine);
        };
    }, []);

    return (
        <section className="section-padding" style={{ position: 'relative', overflow: 'hidden' }}>
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <span style={{ color: '#10b981', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.875rem', letterSpacing: '0.05em' }}>
                        Nasze Kompetencje
                    </span>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                        W czym się <span className="text-gradient">specjalizujemy</span>?
                    </h2>
                    <p style={{ color: '#9ca3af', marginTop: '1rem' }}>
                        Przeciągnij elementy, aby zobaczyć jak działamy pod presją ;)
                    </p>
                </div>

                <div
                    ref={sceneRef}
                    className="glass-panel"
                    style={{
                        width: '100%',
                        height: '400px',
                        borderRadius: '1.5rem',
                        overflow: 'hidden',
                        position: 'relative'
                    }}
                />
            </div>
        </section>
    );
};
