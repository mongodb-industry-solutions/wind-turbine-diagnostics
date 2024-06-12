import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { ToastProvider } from '@leafygreen-ui/toast';
import LeafyGreenProvider from "@leafygreen-ui/leafygreen-provider";
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {

    const router = useRouter();
  
    useEffect(() => {
        fetch('/api/socket');
        if (router.pathname === '/') {
            router.push('/home');
        }
    }, [router]);

    return (
        <LeafyGreenProvider darkMode={true}>
            <ToastProvider>
                <Component {...pageProps} />
            </ToastProvider>
        </LeafyGreenProvider>
    );
}

export default MyApp;