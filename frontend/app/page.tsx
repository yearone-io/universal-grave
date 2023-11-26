import './globals.css';
import {Metadata} from "next";
import Landing from "@/components/Landing";

export const metadata: Metadata = {
  title: 'GRAVE',
  description: 'A cemetery for unwanted digital assets',
  twitter: {
    card: "summary",
    images: {
      url: "https://universal-grave.netlify.app/images/logo-text.png",
    }
  }
}

export default function Home() {
  return <Landing />
}
