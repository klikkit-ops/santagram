import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Create Your Personalized Santa Video | SantaGram",
  description: "Create a magical personalized video message from Santa Claus for your child! Tell us about your child and Santa will create a special message just for them. Ready in 10 minutes!",
  keywords: [
    "create santa video",
    "personalized santa video",
    "santa video maker",
    "custom santa message",
    "santa video creator",
  ],
  openGraph: {
    title: "Create Your Personalized Santa Video | SantaGram",
    description: "Create a magical personalized video message from Santa Claus for your child! Ready in 10 minutes!",
    url: "https://santagram.app/create",
  },
  alternates: {
    canonical: "https://santagram.app/create",
  },
};

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

