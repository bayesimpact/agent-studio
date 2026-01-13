import axios from "axios"

export abstract class FranceTravailBaseService {
  protected clientId = process.env.FRANCE_TRAVAIL_CLIENT_ID
  protected secretKey = process.env.FRANCE_TRAVAIL_SECRET_KEY

  protected async getAccessToken(): Promise<string> {
    if (!this.clientId || !this.secretKey) {
      throw new Error("France Travail client ID or secret key is not set")
    }

    const params = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.clientId,
      client_secret: this.secretKey,
      scope:
        "api_romeov2 o2dsoffre api_offresdemploiv2 api_evenementsv1 evenements api_labonneboitev2 search office",
    })

    const { data } = await axios.post(
      "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire",
      params.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    )

    return data.access_token
  }

  protected async getROMECodes({ jobTitles }: { jobTitles: string[] }): Promise<string[]> {
    const accessToken = await this.getAccessToken()

    const appellations = jobTitles.map((title, index) => ({
      intitule: title,
      identifiant: `id${index + 1}`,
    }))

    const { data } = await axios.post(
      "https://api.francetravail.io/partenaire/romeo/v2/predictionMetiers",
      {
        appellations,
        options: {
          nomAppelant: "caseai",
          nbResultats: 5,
          seuilScorePrediction: 0.7,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )

    // Extract ROME codes from the response
    const romeCodes: string[] = []
    if (Array.isArray(data)) {
      data.forEach((item: { metiersRome: { codeRome: string }[] }) => {
        if (item.metiersRome) {
          item.metiersRome.forEach((metier) => {
            if (metier.codeRome && !romeCodes.includes(metier.codeRome)) {
              romeCodes.push(metier.codeRome)
            }
          })
        }
      })
    }

    return romeCodes
  }

  protected extractSecteurActivite(romeCodes: string[]): string[] {
    // Extract first letter from each ROME code for secteurActivite
    return [...new Set(romeCodes.map((code) => code.charAt(0)))]
  }
}
