'use client'

import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";

export function Chat() {
  

  return (
   <Input
    addon={ <Button onClick={function noRefCheck(){}}>
  Envoyer
</Button>}

      label="Poser une question"
      state="default"
      
      stateRelatedMessage="Text de validation / d'explication de l'erreur"
    />
  )
}


