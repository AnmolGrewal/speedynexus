import '../../src/app/globals.css';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-primary-background-color">
      <main className="flex-grow">
        <Component {...pageProps} />
      </main>
    </div>
  );
}

export default MyApp;
