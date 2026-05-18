/**
 * Plantilla PDF del informe de inspección.
 *
 * Mantiene el layout del template Django legacy (header rojo Safe 360, tabla
 * de preguntas por sección con respuesta coloreada, tarjeta de evaluación,
 * grids de fotos) pero implementado con `@react-pdf/renderer` para que se
 * genere 100% en el cliente — sin Django ni servicio externo de PDF.
 *
 * No importar este archivo desde código server-side: `@react-pdf/renderer`
 * solo funciona en el navegador.
 */
import {
    Document,
    Image,
    Page,
    StyleSheet,
    Text,
    View,
} from "@react-pdf/renderer";

// =====================================================================
// Datos esperados
// =====================================================================

export interface PdfQuestionItem {
    question: string;
    answer: "good" | "regular" | "bad" | "not_applicable" | string;
    observation: string | null;
    photos: string[];
}

export interface PdfSection {
    header: string;
    questions: PdfQuestionItem[];
}

export interface PdfEvaluation {
    totalScore: number;
    maxPossibleScore: number;
    percentage: number;
    rating: string;
}

export interface InspectionReportPdfData {
    projectCode: string;
    installationName: string;
    inspectionType: string;
    clientName: string;
    dateLabel: string;       // "16 may 2026 14:32"
    inspectorName: string;
    inspectorEmail: string;
    gpsLatitude: number;
    gpsLongitude: number;
    generatedAtLabel: string;
    activities: string[];
    subcontractors: string[];
    evaluation: PdfEvaluation | null;
    sections: PdfSection[];
    observation: {
        text: string | null;
        photos: string[];
    } | null;
}

// =====================================================================
// Estilos
// =====================================================================

const COLOR = {
    primary: "#DA291C",
    primaryDark: "#BD2217",
    primarySoft: "#FEF2F1",
    primaryEdge: "#F28C7C",
    ink: "#39322F",
    muted: "#786B66",
    inkSoft: "#9CA3AF",
    good: "#059669",
    regular: "#D97706",
    bad: "#DC2626",
    border: "#E5E7EB",
};

const styles = StyleSheet.create({
    page: {
        paddingTop: 30,
        paddingBottom: 36,
        paddingHorizontal: 32,
        fontSize: 10,
        fontFamily: "Helvetica",
        color: "#333333",
        // OJO: nada de lineHeight global aquí. Si se pone, los textos grandes
        // (titulares, score de evaluación) se solapan con el siguiente bloque
        // porque la métrica de altura efectiva > altura calculada del flow.
    },
    // Header
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    headerSide: { flex: 1 },
    headerCenter: { flex: 2, textAlign: "center" },
    title: {
        color: COLOR.primary,
        fontSize: 20,
        fontFamily: "Helvetica-Bold",
        textAlign: "center",
    },
    subtitle: {
        color: "#6B7280",
        fontSize: 11,
        textAlign: "center",
        marginTop: 2,
    },
    headerDivider: {
        marginTop: 10,
        marginBottom: 14,
        borderBottomWidth: 2,
        borderBottomColor: COLOR.primary,
    },
    // Sections
    h2: {
        color: COLOR.primary,
        fontSize: 13,
        fontFamily: "Helvetica-Bold",
        marginTop: 12,
        marginBottom: 6,
        paddingBottom: 3,
        borderBottomWidth: 1.5,
        borderBottomColor: COLOR.primaryEdge,
    },
    h3: {
        color: COLOR.muted,
        fontSize: 11,
        fontFamily: "Helvetica-Bold",
        marginTop: 10,
        marginBottom: 6,
        paddingVertical: 4,
        paddingHorizontal: 8,
        backgroundColor: COLOR.primarySoft,
        borderLeftWidth: 3,
        borderLeftColor: COLOR.primary,
    },
    // Info grid
    infoGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 4,
        marginBottom: 4,
    },
    infoItem: {
        width: "48%",
        marginRight: "2%",
        marginBottom: 6,
        backgroundColor: COLOR.primarySoft,
        paddingVertical: 5,
        paddingHorizontal: 8,
        borderLeftWidth: 2,
        borderLeftColor: COLOR.primary,
    },
    infoLabel: {
        fontFamily: "Helvetica-Bold",
        color: COLOR.muted,
        fontSize: 8,
        textTransform: "uppercase",
        marginBottom: 1,
    },
    infoValue: {
        color: COLOR.ink,
        fontSize: 10,
    },
    // Pills (activities, subcontractors)
    pillsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 2,
        marginBottom: 4,
    },
    pill: {
        backgroundColor: COLOR.primaryEdge,
        color: "white",
        paddingVertical: 2,
        paddingHorizontal: 8,
        borderRadius: 10,
        fontSize: 9,
        marginRight: 4,
        marginBottom: 4,
    },
    // Evaluation card
    evalCard: {
        backgroundColor: COLOR.primary,
        padding: 16,
        borderRadius: 6,
        marginTop: 8,
        marginBottom: 4,
        alignItems: "center",
    },
    evalRating: {
        color: "white",
        fontFamily: "Helvetica-Bold",
        fontSize: 13,
        textTransform: "uppercase",
        letterSpacing: 1,
        textAlign: "center",
        marginBottom: 8,
    },
    evalScore: {
        color: "white",
        fontFamily: "Helvetica-Bold",
        fontSize: 26,
        textAlign: "center",
        marginBottom: 8,
    },
    evalDetail: {
        color: "white",
        fontSize: 10,
        textAlign: "center",
    },
    // Tables
    table: {
        marginTop: 6,
        marginBottom: 10,
        borderTopWidth: 1,
        borderTopColor: COLOR.primaryEdge,
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: COLOR.primary,
    },
    thCell: {
        paddingVertical: 5,
        paddingHorizontal: 6,
    },
    th: {
        color: "white",
        fontFamily: "Helvetica-Bold",
        fontSize: 9.5,
    },
    tr: {
        flexDirection: "row",
        borderBottomWidth: 0.5,
        borderBottomColor: COLOR.primaryEdge,
        alignItems: "stretch",
    },
    trEven: { backgroundColor: COLOR.primarySoft },
    tdCell: {
        paddingVertical: 6,
        paddingHorizontal: 6,
    },
    td: {
        fontSize: 9.5,
        color: COLOR.ink,
        // line-height por texto, no global → el row crece con multi-líneas
        // sin que el texto largo invada el siguiente row.
        lineHeight: 1.35,
    },
    colQuestion: { width: "50%" },
    colAnswer: { width: "18%" },
    colObservation: { width: "32%" },
    answerGood: { color: COLOR.good, fontFamily: "Helvetica-Bold" },
    answerRegular: { color: COLOR.regular, fontFamily: "Helvetica-Bold" },
    answerBad: { color: COLOR.bad, fontFamily: "Helvetica-Bold" },
    answerNa: { color: COLOR.muted, fontStyle: "italic" },
    // Observation box
    obsBox: {
        backgroundColor: COLOR.primarySoft,
        borderLeftWidth: 3,
        borderLeftColor: COLOR.primary,
        padding: 8,
        marginTop: 4,
        marginBottom: 6,
    },
    // Photos
    photoGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 4,
        marginBottom: 6,
    },
    photoItem: {
        width: "48%",
        marginRight: "2%",
        marginBottom: 6,
    },
    photoImage: {
        width: "100%",
        height: 140,
        objectFit: "cover",
        borderRadius: 4,
        borderWidth: 0.5,
        borderColor: COLOR.border,
    },
    // Footer
    footer: {
        position: "absolute",
        bottom: 18,
        left: 32,
        right: 32,
        textAlign: "center",
        color: COLOR.muted,
        fontSize: 8,
        borderTopWidth: 1,
        borderTopColor: COLOR.primaryEdge,
        paddingTop: 8,
    },
    footerStrong: { fontFamily: "Helvetica-Bold" },
    footerAccent: { color: COLOR.primary, fontFamily: "Helvetica-Bold" },
    // Misc
    muted: { color: COLOR.muted },
    smallMuted: { color: COLOR.inkSoft, fontStyle: "italic" },
});

// =====================================================================
// Helpers
// =====================================================================

type CellStyle = (typeof styles)[
    | "answerGood"
    | "answerRegular"
    | "answerBad"
    | "answerNa"];

function answerLabel(a: string): { text: string; style: CellStyle | null } {
    switch (a) {
        case "good":
            return { text: "OK Bien", style: styles.answerGood };
        case "regular":
            return { text: "! Regular", style: styles.answerRegular };
        case "bad":
            return { text: "X Mal", style: styles.answerBad };
        case "not_applicable":
            return { text: "No aplica", style: styles.answerNa };
        default:
            return { text: a, style: null };
    }
}

// =====================================================================
// Componente
// =====================================================================

export function InspectionReportPdf({
    data,
}: {
    data: InspectionReportPdfData;
}) {
    return (
        <Document
            title={`Informe de Inspección - ${data.projectCode}`}
            author={data.inspectorName}
        >
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.headerRow}>
                    <View style={styles.headerSide} />
                    <View style={styles.headerCenter}>
                        <Text style={styles.title}>INFORME DE INSPECCIÓN</Text>
                        <Text style={styles.subtitle}>{data.inspectionType}</Text>
                    </View>
                    <View style={styles.headerSide} />
                </View>
                <View style={styles.headerDivider} />

                {/* Info general */}
                <Text style={styles.h2}>Información General</Text>
                <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Código de Proyecto</Text>
                        <Text style={styles.infoValue}>{data.projectCode}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Instalación</Text>
                        <Text style={styles.infoValue}>{data.installationName}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Cliente</Text>
                        <Text style={styles.infoValue}>{data.clientName}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Fecha y Hora</Text>
                        <Text style={styles.infoValue}>{data.dateLabel}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Inspector</Text>
                        <Text style={styles.infoValue}>{data.inspectorName}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Email</Text>
                        <Text style={styles.infoValue}>{data.inspectorEmail}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Ubicación GPS</Text>
                        <Text style={styles.infoValue}>
                            {data.gpsLatitude.toFixed(6)},{" "}
                            {data.gpsLongitude.toFixed(6)}
                        </Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Generado</Text>
                        <Text style={styles.infoValue}>{data.generatedAtLabel}</Text>
                    </View>
                </View>

                {/* Activities */}
                {data.activities.length > 0 && (
                    <>
                        <Text style={styles.h2}>Actividades</Text>
                        <View style={styles.pillsRow}>
                            {data.activities.map((a, i) => (
                                <Text key={`act-${i}`} style={styles.pill}>
                                    {a}
                                </Text>
                            ))}
                        </View>
                    </>
                )}

                {/* Subcontractors */}
                {data.subcontractors.length > 0 && (
                    <>
                        <Text style={styles.h2}>Subcontratistas</Text>
                        <View style={styles.pillsRow}>
                            {data.subcontractors.map((s, i) => (
                                <Text key={`sub-${i}`} style={styles.pill}>
                                    {s}
                                </Text>
                            ))}
                        </View>
                    </>
                )}

                {/* Evaluation */}
                {data.evaluation && (
                    <>
                        <Text style={styles.h2}>Resultado de la Evaluación</Text>
                        <View style={styles.evalCard}>
                            <Text style={styles.evalRating}>
                                {data.evaluation.rating || "Sin clasificar"}
                            </Text>
                            <Text style={styles.evalScore}>
                                {data.evaluation.percentage.toFixed(1)}%
                            </Text>
                            <Text style={styles.evalDetail}>
                                Puntuación: {data.evaluation.totalScore} /{" "}
                                {data.evaluation.maxPossibleScore}
                            </Text>
                        </View>
                    </>
                )}

                {/* Footer (repetido por página) */}
                <Text
                    style={styles.footer}
                    render={({ pageNumber, totalPages }) => (
                        <Text>
                            <Text style={styles.footerStrong}>
                                Informe generado automáticamente por el Sistema de
                                Inspecciones{" "}
                            </Text>
                            <Text style={styles.footerAccent}>Safe 360</Text>
                            <Text>
                                {"  ·  "}Página {pageNumber} de {totalPages}
                            </Text>
                        </Text>
                    )}
                    fixed
                />
            </Page>

            {/* Detalle de inspección (página 2+) */}
            {data.sections.length > 0 && (
                <Page size="A4" style={styles.page}>
                    <Text style={styles.h2}>Detalle de Inspección</Text>
                    {data.sections.map((section, si) => (
                        <View key={`sec-${si}`}>
                            <Text style={styles.h3}>{section.header}</Text>
                            <View style={styles.table}>
                                <View style={styles.tableHeader}>
                                    <View style={[styles.thCell, styles.colQuestion]}>
                                        <Text style={styles.th}>Pregunta</Text>
                                    </View>
                                    <View style={[styles.thCell, styles.colAnswer]}>
                                        <Text style={styles.th}>Respuesta</Text>
                                    </View>
                                    <View style={[styles.thCell, styles.colObservation]}>
                                        <Text style={styles.th}>Observación</Text>
                                    </View>
                                </View>
                                {section.questions.map((q, qi) => {
                                    const a = answerLabel(q.answer);
                                    return (
                                        <View
                                            key={`q-${si}-${qi}`}
                                            style={[
                                                styles.tr,
                                                qi % 2 === 1 ? styles.trEven : {},
                                            ]}
                                            wrap={false}
                                        >
                                            <View
                                                style={[
                                                    styles.tdCell,
                                                    styles.colQuestion,
                                                ]}
                                            >
                                                <Text style={styles.td}>
                                                    {q.question}
                                                </Text>
                                            </View>
                                            <View
                                                style={[
                                                    styles.tdCell,
                                                    styles.colAnswer,
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.td,
                                                        ...(a.style ? [a.style] : []),
                                                    ]}
                                                >
                                                    {a.text}
                                                </Text>
                                            </View>
                                            <View
                                                style={[
                                                    styles.tdCell,
                                                    styles.colObservation,
                                                ]}
                                            >
                                                <Text style={styles.td}>
                                                    {q.observation || "—"}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    ))}

                    <Text
                        style={styles.footer}
                        render={({ pageNumber, totalPages }) => (
                            <Text>
                                <Text style={styles.footerStrong}>
                                    Informe generado automáticamente por el Sistema de
                                    Inspecciones{" "}
                                </Text>
                                <Text style={styles.footerAccent}>Safe 360</Text>
                                <Text>
                                    {"  ·  "}Página {pageNumber} de {totalPages}
                                </Text>
                            </Text>
                        )}
                        fixed
                    />
                </Page>
            )}

            {/* Observación general + fotos */}
            {(data.observation?.text || (data.observation?.photos?.length ?? 0) > 0) && (
                <Page size="A4" style={styles.page}>
                    {data.observation?.text && (
                        <>
                            <Text style={styles.h2}>Observación General</Text>
                            <View style={styles.obsBox}>
                                <Text>{data.observation.text}</Text>
                            </View>
                        </>
                    )}
                    {(data.observation?.photos?.length ?? 0) > 0 && (
                        <>
                            <Text style={styles.h2}>Fotografías de la Observación</Text>
                            <View style={styles.photoGrid}>
                                {data.observation!.photos.map((p, i) => (
                                    // eslint-disable-next-line jsx-a11y/alt-text
                                    <View key={`obs-photo-${i}`} style={styles.photoItem}>
                                        {/* eslint-disable-next-line jsx-a11y/alt-text */}
                                        <Image src={p} style={styles.photoImage} />
                                    </View>
                                ))}
                            </View>
                        </>
                    )}

                    <Text
                        style={styles.footer}
                        render={({ pageNumber, totalPages }) => (
                            <Text>
                                <Text style={styles.footerStrong}>
                                    Informe generado automáticamente por el Sistema de
                                    Inspecciones{" "}
                                </Text>
                                <Text style={styles.footerAccent}>Safe 360</Text>
                                <Text>
                                    {"  ·  "}Página {pageNumber} de {totalPages}
                                </Text>
                            </Text>
                        )}
                        fixed
                    />
                </Page>
            )}

            {/* Páginas adicionales: fotos por pregunta */}
            {data.sections.map((section, si) =>
                section.questions
                    .filter((q) => q.photos.length > 0)
                    .map((q, qi) => (
                        <Page key={`q-photos-${si}-${qi}`} size="A4" style={styles.page}>
                            <Text style={styles.h2}>
                                Fotografías: {q.question.slice(0, 100)}
                            </Text>
                            <View style={styles.photoGrid}>
                                {q.photos.map((p, pi) => (
                                    <View
                                        key={`q-${si}-${qi}-${pi}`}
                                        style={styles.photoItem}
                                    >
                                        {/* eslint-disable-next-line jsx-a11y/alt-text */}
                                        <Image src={p} style={styles.photoImage} />
                                    </View>
                                ))}
                            </View>

                            <Text
                                style={styles.footer}
                                render={({ pageNumber, totalPages }) => (
                                    <Text>
                                        <Text style={styles.footerStrong}>
                                            Informe generado automáticamente por el
                                            Sistema de Inspecciones{" "}
                                        </Text>
                                        <Text style={styles.footerAccent}>Safe 360</Text>
                                        <Text>
                                            {"  ·  "}Página {pageNumber} de {totalPages}
                                        </Text>
                                    </Text>
                                )}
                                fixed
                            />
                        </Page>
                    )),
            )}
        </Document>
    );
}
