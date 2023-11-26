import {Metadata} from "next";
import MyGrave from "@/components/MyGrave";

export const metadata: Metadata = {
    title: 'YOUR GRAVEYARD',
    description: 'List and manage assets in your graveyard',
    openGraph: {
        images: {
            url: "https://universal-grave.netlify.app/images/logo-text.png",
        }
    },
    twitter: {
        card: "summary",
    }
}

export default function Grave() {
    return <MyGrave />
}
