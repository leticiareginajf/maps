import "./globals.css";

export const metadata = {
    title: "Coletor Geodésico GPS",
    description: "Aplicativo PWA de Geoprocessamento para Coleta em Campo",
    manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
    return (
        <html lang="pt-BR"><head><meta name="theme-color" content="#2563eb" /><link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            if (typeof window !== "undefined" && "serviceWorker" in navigator) {
                                if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
                                    // No computador local: desativa para nunca travar o desenvolvimento
                                    navigator.serviceWorker.getRegistrations().then((regs) => {
                                        for (let r of regs) r.unregister();
                                    });
                                } else {
                                    // Na nuvem (Vercel): ativa o suporte offline completo
                                    window.addEventListener("load", () => {
                                        navigator.serviceWorker.register("/sw.js");
                                    });
                                }
                            }`,
                    }}
                /></head><body>{children}</body></html>
    );
}