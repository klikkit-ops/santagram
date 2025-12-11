import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Snowfall from "@/components/Snowfall";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "Personalized Santa Video Messages | Create Magical Moments | SantaGram",
  description: "Create a magical, personalized video message from Santa Claus for your child! Videos where Santa knows their name, achievements & special interests. Ready in minutes!",
  keywords: "personalized santa video, santa message for kids, custom santa video, christmas video message, santa claus video call, personalized christmas video, santa video for children",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://santagram.app",
    siteName: "SantaGram",
    title: "Personalized Santa Video Messages | Create Magical Moments",
    description: "Create a magical, personalized video message from Santa Claus for your child! Videos where Santa knows their name. Ready in minutes!",
    images: [
      {
        url: "/santa.png",
        width: 1200,
        height: 630,
        alt: "SantaGram - Personalized Video Messages from Santa",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Personalized Santa Video Messages",
    description: "Create a magical video message from Santa for your child!",
    images: ["/santa.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Mountains+of+Christmas:wght@400;700&family=Outfit:wght@400;500;600;700&family=Quicksand:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        {/* Microsoft Clarity */}
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "uk1x5ay3sd");
            `,
          }}
        />
        {/* Meta Pixel Code */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1190489765865173');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=1190489765865173&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              name: "Personalized Santa Video Message",
              description: "Personalized video message from Santa Claus for your child",
              image: "https://santagram.app/santa.png",
              brand: {
                "@type": "Brand",
                name: "SantaGram",
              },
              offers: {
                "@type": "Offer",
                price: "2.99",
                priceCurrency: "USD",
                availability: "https://schema.org/InStock",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.9",
                reviewCount: "10000",
              },
            }),
          }}
        />
      </head>
      <body className="antialiased">
        <CurrencyProvider>
          <Snowfall />
          <Navbar />
          <main className="relative z-10">
            {children}
          </main>
          <Footer />
        </CurrencyProvider>
        <Analytics />
      </body>
    </html>
  );
}
