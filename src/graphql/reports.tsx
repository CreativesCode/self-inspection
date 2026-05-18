/**
 * Re-exports legacy de reportes hacia los servicios Supabase.
 */
export {
    getInspectionReport as GET_INSPECTION_REPORT,
    generateReport as GENERATE_REPORT,
} from "@/lib/data/reports";

export type { UIReportJob } from "@/lib/data/reports";
