import type { WeddingStore, BudgetItem, Payment, Guest, ChecklistItem } from "#lib/stores/wedding";
import { formatDate, getPaymentStatus, categoryLabel, rsvpStatusLabel } from "#lib/utils/format";

function xmlEscape(str: string | number | null | undefined): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function triggerDownload(xmlContent: string, filename: string): void {
  const blob = new Blob([xmlContent], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const COMMON_STYLES = `
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="HeaderTitle">
   <Font ss:FontName="Calibri" ss:Size="15" ss:Bold="1" ss:Color="#8B5E52"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="MetaLabel">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#5C453D"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="MetaValue">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#2C1810"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="TableHeader">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#C9847A" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A8685E"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A8685E"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A8685E"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A8685E"/>
   </Borders>
  </Style>
  <Style ss:ID="DataCell">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#2C1810"/>
   <Alignment ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#EAD8D4"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#EAD8D4"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#EAD8D4"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#EAD8D4"/>
   </Borders>
  </Style>
  <Style ss:ID="DataCellCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#2C1810"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#EAD8D4"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#EAD8D4"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#EAD8D4"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#EAD8D4"/>
   </Borders>
  </Style>
  <Style ss:ID="CurrencyCell">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#2C1810"/>
   <NumberFormat ss:Format="Rp #,##0"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#EAD8D4"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#EAD8D4"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#EAD8D4"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#EAD8D4"/>
   </Borders>
  </Style>
  <Style ss:ID="TotalLabelRow">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#2C1810"/>
   <Interior ss:Color="#F5E6E0" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#8B5E52"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#8B5E52"/>
   </Borders>
  </Style>
  <Style ss:ID="TotalCurrencyRow">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#8B5E52"/>
   <Interior ss:Color="#F5E6E0" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="Rp #,##0"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#8B5E52"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#8B5E52"/>
   </Borders>
  </Style>
  <Style ss:ID="BadgeLunas">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#1B4D3E"/>
   <Interior ss:Color="#E6F4EA" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#EAD8D4"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#EAD8D4"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#EAD8D4"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#EAD8D4"/>
   </Borders>
  </Style>
  <Style ss:ID="BadgeDP">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#7A4E1D"/>
   <Interior ss:Color="#FEF3D6" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#EAD8D4"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#EAD8D4"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#EAD8D4"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#EAD8D4"/>
   </Borders>
  </Style>
  <Style ss:ID="BadgeBelum">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#6E5A53"/>
   <Interior ss:Color="#F5ECE9" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#EAD8D4"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#EAD8D4"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#EAD8D4"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#EAD8D4"/>
   </Borders>
  </Style>
`;

function generateBudgetSheetXml(wedding: WeddingStore): string {
  const couple = String(wedding.info.groomName || "Pengantin Pria") + " & " + String(wedding.info.brideName || "Pengantin Wanita");
  const dateStr = formatDate(wedding.info.weddingDate);

  let totalAllocated = 0;
  let totalPaid = 0;

  const rows: Array<{
    categoryName: string;
    item: BudgetItem;
    totalCost: number;
    paidAmount: number;
    balance: number;
    status: "belum" | "dp" | "lunas";
    dueDate: string;
  }> = [];

  wedding.budgetCategories.forEach((cat) => {
    cat.items.forEach((item) => {
      const totalCost = item.quantity * item.unitPrice;
      const paidAmount = item.payments
        .filter((p) => p.paidAt)
        .reduce((sum, p) => sum + p.amount, 0);
      const balance = Math.max(0, totalCost - paidAmount);
      const status = getPaymentStatus(item);
      const dueDate = item.payments.find((p) => !p.paidAt)?.dueDate || item.payments[0]?.dueDate || "";

      totalAllocated += totalCost;
      totalPaid += paidAmount;

      rows.push({
        categoryName: cat.name,
        item,
        totalCost,
        paidAmount,
        balance,
        status,
        dueDate,
      });
    });
  });

  const totalRemaining = Math.max(0, totalAllocated - totalPaid);

  let xml = " <Worksheet ss:Name=\"Rencana &amp; Anggaran\">\n" +
  "  <Table ss:DefaultRowHeight=\"20\">\n" +
  "   <Column ss:Width=\"40\"/>\n" +
  "   <Column ss:Width=\"130\"/>\n" +
  "   <Column ss:Width=\"180\"/>\n" +
  "   <Column ss:Width=\"140\"/>\n" +
  "   <Column ss:Width=\"60\"/>\n" +
  "   <Column ss:Width=\"60\"/>\n" +
  "   <Column ss:Width=\"110\"/>\n" +
  "   <Column ss:Width=\"120\"/>\n" +
  "   <Column ss:Width=\"100\"/>\n" +
  "   <Column ss:Width=\"120\"/>\n" +
  "   <Column ss:Width=\"120\"/>\n" +
  "   <Column ss:Width=\"100\"/>\n" +
  "   <Column ss:Width=\"180\"/>\n\n" +
  "   <Row ss:Height=\"28\">\n" +
  "    <Cell ss:MergeAcross=\"4\" ss:StyleID=\"HeaderTitle\"><Data ss:Type=\"String\">RENCANA ANGGARAN PERNIKAHAN</Data></Cell>\n" +
  "   </Row>\n" +
  "   <Row>\n" +
  "    <Cell ss:StyleID=\"MetaLabel\"><Data ss:Type=\"String\">Pasangan:</Data></Cell>\n" +
  "    <Cell ss:MergeAcross=\"2\" ss:StyleID=\"MetaValue\"><Data ss:Type=\"String\">" + xmlEscape(couple) + "</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"MetaLabel\"><Data ss:Type=\"String\">Total Target Anggaran:</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"CurrencyCell\"><Data ss:Type=\"Number\">" + (wedding.info.totalBudget || totalAllocated) + "</Data></Cell>\n" +
  "   </Row>\n" +
  "   <Row>\n" +
  "    <Cell ss:StyleID=\"MetaLabel\"><Data ss:Type=\"String\">Tanggal:</Data></Cell>\n" +
  "    <Cell ss:MergeAcross=\"2\" ss:StyleID=\"MetaValue\"><Data ss:Type=\"String\">" + xmlEscape(dateStr) + "</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"MetaLabel\"><Data ss:Type=\"String\">Total Terbayar:</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"CurrencyCell\"><Data ss:Type=\"Number\">" + totalPaid + "</Data></Cell>\n" +
  "   </Row>\n" +
  "   <Row>\n" +
  "    <Cell ss:StyleID=\"MetaLabel\"><Data ss:Type=\"String\">Lokasi/Gedung:</Data></Cell>\n" +
  "    <Cell ss:MergeAcross=\"2\" ss:StyleID=\"MetaValue\"><Data ss:Type=\"String\">" + xmlEscape(wedding.info.venueType || "-") + "</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"MetaLabel\"><Data ss:Type=\"String\">Sisa Tagihan:</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"CurrencyCell\"><Data ss:Type=\"Number\">" + totalRemaining + "</Data></Cell>\n" +
  "   </Row>\n" +
  "   <Row ss:Height=\"12\"></Row>\n\n" +
  "   <Row ss:Height=\"24\">\n" +
  "    <Cell ss:StyleID=\"TableHeader\"><Data ss:Type=\"String\">No</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"TableHeader\"><Data ss:Type=\"String\">Kategori</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"TableHeader\"><Data ss:Type=\"String\">Nama Pos / Item</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"TableHeader\"><Data ss:Type=\"String\">Vendor</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"TableHeader\"><Data ss:Type=\"String\">Jumlah</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"TableHeader\"><Data ss:Type=\"String\">Satuan</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"TableHeader\"><Data ss:Type=\"String\">Harga Satuan</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"TableHeader\"><Data ss:Type=\"String\">Total Biaya</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"TableHeader\"><Data ss:Type=\"String\">Status</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"TableHeader\"><Data ss:Type=\"String\">Terbayar</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"TableHeader\"><Data ss:Type=\"String\">Sisa Tagihan</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"TableHeader\"><Data ss:Type=\"String\">Jatuh Tempo</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"TableHeader\"><Data ss:Type=\"String\">Catatan</Data></Cell>\n" +
  "   </Row>\n";

  rows.forEach((r, idx) => {
    const statusStyle = r.status === "lunas" ? "BadgeLunas" : r.status === "dp" ? "BadgeDP" : "BadgeBelum";
    const statusText = r.status === "lunas" ? "Lunas" : r.status === "dp" ? "DP" : "Belum Bayar";

    xml += "   <Row>\n" +
    "    <Cell ss:StyleID=\"DataCellCenter\"><Data ss:Type=\"Number\">" + (idx + 1) + "</Data></Cell>\n" +
    "    <Cell ss:StyleID=\"DataCell\"><Data ss:Type=\"String\">" + xmlEscape(r.categoryName) + "</Data></Cell>\n" +
    "    <Cell ss:StyleID=\"DataCell\"><Data ss:Type=\"String\">" + xmlEscape(r.item.name) + "</Data></Cell>\n" +
    "    <Cell ss:StyleID=\"DataCell\"><Data ss:Type=\"String\">" + xmlEscape(r.item.vendorName || "-") + "</Data></Cell>\n" +
    "    <Cell ss:StyleID=\"DataCellCenter\"><Data ss:Type=\"Number\">" + (r.item.quantity || 1) + "</Data></Cell>\n" +
    "    <Cell ss:StyleID=\"DataCellCenter\"><Data ss:Type=\"String\">" + xmlEscape(r.item.unit || "item") + "</Data></Cell>\n" +
    "    <Cell ss:StyleID=\"CurrencyCell\"><Data ss:Type=\"Number\">" + r.item.unitPrice + "</Data></Cell>\n" +
    "    <Cell ss:StyleID=\"CurrencyCell\"><Data ss:Type=\"Number\">" + r.totalCost + "</Data></Cell>\n" +
    "    <Cell ss:StyleID=\"" + statusStyle + "\"><Data ss:Type=\"String\">" + statusText + "</Data></Cell>\n" +
    "    <Cell ss:StyleID=\"CurrencyCell\"><Data ss:Type=\"Number\">" + r.paidAmount + "</Data></Cell>\n" +
    "    <Cell ss:StyleID=\"CurrencyCell\"><Data ss:Type=\"Number\">" + r.balance + "</Data></Cell>\n" +
    "    <Cell ss:StyleID=\"DataCellCenter\"><Data ss:Type=\"String\">" + xmlEscape(r.dueDate || "-") + "</Data></Cell>\n" +
    "    <Cell ss:StyleID=\"DataCell\"><Data ss:Type=\"String\">" + xmlEscape(r.item.notes || "-") + "</Data></Cell>\n" +
    "   </Row>\n";
  });

  xml += "   <Row ss:Height=\"22\">\n" +
  "    <Cell ss:MergeAcross=\"6\" ss:StyleID=\"TotalLabelRow\"><Data ss:Type=\"String\">TOTAL KESELURUHAN:</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"TotalCurrencyRow\"><Data ss:Type=\"Number\">" + totalAllocated + "</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"TotalLabelRow\"><Data ss:Type=\"String\"></Data></Cell>\n" +
  "    <Cell ss:StyleID=\"TotalCurrencyRow\"><Data ss:Type=\"Number\">" + totalPaid + "</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"TotalCurrencyRow\"><Data ss:Type=\"Number\">" + totalRemaining + "</Data></Cell>\n" +
  "    <Cell ss:MergeAcross=\"1\" ss:StyleID=\"TotalLabelRow\"><Data ss:Type=\"String\"></Data></Cell>\n" +
  "   </Row>\n" +
  "  </Table>\n" +
  " </Worksheet>\n";

  return xml;
}

function generateGuestsSheetXml(wedding: WeddingStore): string {
  const guests = wedding.guests || [];
  const totalGuests = guests.length;
  const hadirCount = guests.filter((g) => g.rsvpStatus === "hadir").reduce((sum, g) => sum + (g.guestCount || 1), 0);
  const pendingCount = guests.filter((g) => g.rsvpStatus === "pending").length;
  const tidakHadirCount = guests.filter((g) => g.rsvpStatus === "tidak_hadir").length;

  let xml = " <Worksheet ss:Name=\"Daftar Tamu &amp; RSVP\">\n" +
  "  <Table ss:DefaultRowHeight=\"20\">\n" +
  "   <Column ss:Width=\"40\"/>\n" +
  "   <Column ss:Width=\"160\"/>\n" +
  "   <Column ss:Width=\"120\"/>\n" +
  "   <Column ss:Width=\"120\"/>\n" +
  "   <Column ss:Width=\"160\"/>\n" +
  "   <Column ss:Width=\"70\"/>\n" +
  "   <Column ss:Width=\"110\"/>\n" +
  "   <Column ss:Width=\"200\"/>\n" +
  "   <Column ss:Width=\"220\"/>\n\n" +
  "   <Row ss:Height=\"28\">\n" +
  "    <Cell ss:MergeAcross=\"4\" ss:StyleID=\"HeaderTitle\"><Data ss:Type=\"String\">DAFTAR TAMU UNDANGAN &amp; RSVP</Data></Cell>\n" +
  "   </Row>\n" +
  "   <Row>\n" +
  "    <Cell ss:StyleID=\"MetaLabel\"><Data ss:Type=\"String\">Total Undangan:</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"MetaValue\"><Data ss:Type=\"Number\">" + totalGuests + "</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"MetaLabel\"><Data ss:Type=\"String\">Tamu Konfirmasi Hadir:</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"MetaValue\"><Data ss:Type=\"String\">" + hadirCount + " Orang</Data></Cell>\n" +
  "   </Row>\n" +
  "   <Row>\n" +
  "    <Cell ss:StyleID=\"MetaLabel\"><Data ss:Type=\"String\">Belum Respons:</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"MetaValue\"><Data ss:Type=\"Number\">" + pendingCount + "</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"MetaLabel\"><Data ss:Type=\"String\">Berhalangan Hadir:</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"MetaValue\"><Data ss:Type=\"Number\">" + tidakHadirCount + "</Data></Cell>\n" +
  "   </Row>\n" +
  "   <Row ss:Height=\"12\"></Row>\n\n" +
  "   <Row ss:Height=\"24\">\n" +
  "    <Cell ss:StyleID=\"TableHeader\"><Data ss:Type=\"String\">No</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"TableHeader\"><Data ss:Type=\"String\">Nama Tamu</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"TableHeader\"><Data ss:Type=\"String\">Kategori</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"TableHeader\"><Data ss:Type=\"String\">No. WhatsApp / HP</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"TableHeader\"><Data ss:Type=\"String\">Email</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"TableHeader\"><Data ss:Type=\"String\">Pax</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"TableHeader\"><Data ss:Type=\"String\">Status RSVP</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"TableHeader\"><Data ss:Type=\"String\">Link RSVP</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"TableHeader\"><Data ss:Type=\"String\">Pesan / Ucapan</Data></Cell>\n" +
  "   </Row>\n";

  guests.forEach((g, idx) => {
    const statusStyle = g.rsvpStatus === "hadir" ? "BadgeLunas" : g.rsvpStatus === "tidak_hadir" ? "BadgeBelum" : "BadgeDP";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const rsvpUrl = g.rsvpToken ? (origin + "/rsvp/" + g.rsvpToken) : "-";

    xml += "   <Row>\n" +
    "    <Cell ss:StyleID=\"DataCellCenter\"><Data ss:Type=\"Number\">" + (idx + 1) + "</Data></Cell>\n" +
    "    <Cell ss:StyleID=\"DataCell\"><Data ss:Type=\"String\">" + xmlEscape(g.name) + "</Data></Cell>\n" +
    "    <Cell ss:StyleID=\"DataCell\"><Data ss:Type=\"String\">" + xmlEscape(categoryLabel(g.category)) + "</Data></Cell>\n" +
    "    <Cell ss:StyleID=\"DataCellCenter\"><Data ss:Type=\"String\">" + xmlEscape(g.phone || "-") + "</Data></Cell>\n" +
    "    <Cell ss:StyleID=\"DataCell\"><Data ss:Type=\"String\">" + xmlEscape(g.email || "-") + "</Data></Cell>\n" +
    "    <Cell ss:StyleID=\"DataCellCenter\"><Data ss:Type=\"Number\">" + (g.guestCount || 1) + "</Data></Cell>\n" +
    "    <Cell ss:StyleID=\"" + statusStyle + "\"><Data ss:Type=\"String\">" + rsvpStatusLabel(g.rsvpStatus) + "</Data></Cell>\n" +
    "    <Cell ss:StyleID=\"DataCell\"><Data ss:Type=\"String\">" + xmlEscape(rsvpUrl) + "</Data></Cell>\n" +
    "    <Cell ss:StyleID=\"DataCell\"><Data ss:Type=\"String\">" + xmlEscape(g.rsvpMessage || "-") + "</Data></Cell>\n" +
    "   </Row>\n";
  });

  xml += "  </Table>\n" +
  " </Worksheet>\n";

  return xml;
}

function generateChecklistSheetXml(wedding: WeddingStore): string {
  const items = wedding.checklist || [];
  const completedCount = items.filter((c) => c.completed).length;
  const pendingCount = items.length - completedCount;

  let xml = " <Worksheet ss:Name=\"Checklist Persiapan\">\n" +
  "  <Table ss:DefaultRowHeight=\"20\">\n" +
  "   <Column ss:Width=\"40\"/>\n" +
  "   <Column ss:Width=\"120\"/>\n" +
  "   <Column ss:Width=\"260\"/>\n" +
  "   <Column ss:Width=\"130\"/>\n" +
  "   <Column ss:Width=\"110\"/>\n" +
  "   <Column ss:Width=\"100\"/>\n" +
  "   <Column ss:Width=\"180\"/>\n\n" +
  "   <Row ss:Height=\"28\">\n" +
  "    <Cell ss:MergeAcross=\"4\" ss:StyleID=\"HeaderTitle\"><Data ss:Type=\"String\">CHECKLIST PERSIAPAN PERNIKAHAN</Data></Cell>\n" +
  "   </Row>\n" +
  "   <Row>\n" +
  "    <Cell ss:StyleID=\"MetaLabel\"><Data ss:Type=\"String\">Total Tugas:</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"MetaValue\"><Data ss:Type=\"Number\">" + items.length + "</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"MetaLabel\"><Data ss:Type=\"String\">Sudah Selesai:</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"MetaValue\"><Data ss:Type=\"String\">" + completedCount + " Tugas</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"MetaLabel\"><Data ss:Type=\"String\">Belum Selesai:</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"MetaValue\"><Data ss:Type=\"String\">" + pendingCount + " Tugas</Data></Cell>\n" +
  "   </Row>\n" +
  "   <Row ss:Height=\"12\"></Row>\n\n" +
  "   <Row ss:Height=\"24\">\n" +
  "    <Cell ss:StyleID=\"TableHeader\"><Data ss:Type=\"String\">No</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"TableHeader\"><Data ss:Type=\"String\">Kategori</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"TableHeader\"><Data ss:Type=\"String\">Tugas / Rencana</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"TableHeader\"><Data ss:Type=\"String\">Penanggung Jawab</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"TableHeader\"><Data ss:Type=\"String\">Tenggat Waktu</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"TableHeader\"><Data ss:Type=\"String\">Status</Data></Cell>\n" +
  "    <Cell ss:StyleID=\"TableHeader\"><Data ss:Type=\"String\">Catatan</Data></Cell>\n" +
  "   </Row>\n";

  items.forEach((c, idx) => {
    const statusStyle = c.completed ? "BadgeLunas" : "BadgeBelum";
    const statusText = c.completed ? "Selesai" : "Belum";

    xml += "   <Row>\n" +
    "    <Cell ss:StyleID=\"DataCellCenter\"><Data ss:Type=\"Number\">" + (idx + 1) + "</Data></Cell>\n" +
    "    <Cell ss:StyleID=\"DataCell\"><Data ss:Type=\"String\">" + xmlEscape(c.category || "-") + "</Data></Cell>\n" +
    "    <Cell ss:StyleID=\"DataCell\"><Data ss:Type=\"String\">" + xmlEscape(c.text) + "</Data></Cell>\n" +
    "    <Cell ss:StyleID=\"DataCell\"><Data ss:Type=\"String\">" + xmlEscape(c.assignee || "-") + "</Data></Cell>\n" +
    "    <Cell ss:StyleID=\"DataCellCenter\"><Data ss:Type=\"String\">" + xmlEscape(c.dueDate || "-") + "</Data></Cell>\n" +
    "    <Cell ss:StyleID=\"" + statusStyle + "\"><Data ss:Type=\"String\">" + statusText + "</Data></Cell>\n" +
    "    <Cell ss:StyleID=\"DataCell\"><Data ss:Type=\"String\">" + xmlEscape(c.notes || "-") + "</Data></Cell>\n" +
    "   </Row>\n";
  });

  xml += "  </Table>\n" +
  " </Worksheet>\n";

  return xml;
}

function buildWorkbookXml(worksheetsXml: string): string {
  return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
  "<?mso-application progid=\"Excel.Sheet\"?>\n" +
  "<Workbook xmlns=\"urn:schemas-microsoft-com:office:spreadsheet\"\n" +
  " xmlns:o=\"urn:schemas-microsoft-com:office:office\"\n" +
  " xmlns:x=\"urn:schemas-microsoft-com:office:excel\"\n" +
  " xmlns:ss=\"urn:schemas-microsoft-com:office:spreadsheet\"\n" +
  " xmlns:html=\"http://www.w3.org/TR/REC-html40\">\n" +
  " <DocumentProperties xmlns=\"urn:schemas-microsoft-com:office:office\">\n" +
  "  <Author>Nikahku Wedding Planner</Author>\n" +
  "  <Created>" + new Date().toISOString() + "</Created>\n" +
  " </DocumentProperties>\n" +
  " <Styles>\n" +
  COMMON_STYLES + "\n" +
  " </Styles>\n" +
  worksheetsXml + "\n" +
  "</Workbook>";
}

export function exportWeddingToExcel(wedding: WeddingStore): void {
  const coupleSlug = String(wedding.info.groomName || "Groom") + "-" + String(wedding.info.brideName || "Bride");
  const cleanSlug = coupleSlug.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const dateSlug = wedding.info.weddingDate || new Date().toISOString().split("T")[0];
  const filename = "Nikahku-" + cleanSlug + "-" + dateSlug + ".xls";

  const sheetsXml =
    generateBudgetSheetXml(wedding) +
    generateGuestsSheetXml(wedding) +
    generateChecklistSheetXml(wedding);

  const fullXml = buildWorkbookXml(sheetsXml);
  triggerDownload(fullXml, filename);
}

export function exportBudgetToExcel(wedding: WeddingStore): void {
  const coupleSlug = String(wedding.info.groomName || "Groom") + "-" + String(wedding.info.brideName || "Bride");
  const cleanSlug = coupleSlug.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const filename = "Nikahku-Anggaran-" + cleanSlug + ".xls";

  const sheetsXml = generateBudgetSheetXml(wedding);
  const fullXml = buildWorkbookXml(sheetsXml);
  triggerDownload(fullXml, filename);
}

export function exportGuestsToExcel(wedding: WeddingStore): void {
  const coupleSlug = String(wedding.info.groomName || "Groom") + "-" + String(wedding.info.brideName || "Bride");
  const cleanSlug = coupleSlug.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const filename = "Nikahku-Daftar-Tamu-" + cleanSlug + ".xls";

  const sheetsXml = generateGuestsSheetXml(wedding);
  const fullXml = buildWorkbookXml(sheetsXml);
  triggerDownload(fullXml, filename);
}
