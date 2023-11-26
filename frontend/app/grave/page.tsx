import {Metadata} from "next";
import MyGrave from "@/components/MyGrave";

export const metadata: Metadata = {
    title: 'YOUR GRAVEYARD',
    description: 'List and manage assets in your graveyard',
}

export default function Grave() {
    return <MyGrave />
}
