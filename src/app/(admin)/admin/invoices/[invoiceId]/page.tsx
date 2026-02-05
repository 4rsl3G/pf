import AdminInvoiceDetailClient from "./Client";

export default function Page({ params }: { params: { invoiceId?: string } }) {
  return <AdminInvoiceDetailClient invoiceId={params?.invoiceId ?? ""} />;
}
