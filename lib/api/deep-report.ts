import { apiFetchBlob } from "./client"

/**
 * Rapport de fin de trimestre de la DEEP.
 *
 * Un seul verbe : le document se dépose à la direction régionale, il n'a pas
 * d'écran de consultation. Le backend force d'ailleurs le téléchargement.
 */
export const deepReportApi = {
  downloadPdf: (academicYearId: number, trimester: number): Promise<Blob> =>
    apiFetchBlob(`/reports/deep-trimester/${academicYearId}?trimester=${trimester}`),
}
