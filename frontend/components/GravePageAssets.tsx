'use client';
import LSPAssets from '@/components/LSPAssets';
import {useEffect, useState} from 'react';
import {getGraveVaultFor} from "@/utils/universalProfile";

export default function GravePageAssets({account}: {account:string}) {
    const [graveVault, setGraveVault] = useState<string | null>(null);

    useEffect(() => {
        if(!graveVault){
            getGraveVaultFor(account).then(graveVault => {
                setGraveVault(graveVault);
            });
        }
    }, [account]);
    return <LSPAssets graveVault={graveVault} />
}
