// QuickBooks Export Utilities

export function exportRFQToCSV(rfq: {
  _id: string;
  createdAt: number;
  items: Array<{
    productName: string;
    quantity: number;
  }>;
  quotations?: Array<{
    vendorName: string;
    price: number;
    quantity: number;
    paymentTerms: string;
    deliveryTime: string;
  }>;
}) {
  const rows: string[][] = [];
  
  // Header row
  rows.push([
    "RFQ ID",
    "Date",
    "Product",
    "Quantity",
    "Vendor",
    "Unit Price",
    "Total",
    "Payment Terms",
    "Delivery Time",
  ]);

  // Data rows - one per quotation per item
  if (rfq.quotations && rfq.quotations.length > 0) {
    for (const item of rfq.items) {
      for (const quotation of rfq.quotations) {
        const total = quotation.price * quotation.quantity;
        rows.push([
          rfq._id,
          new Date(rfq.createdAt).toLocaleDateString(),
          item.productName,
          item.quantity.toString(),
          quotation.vendorName,
          quotation.price.toFixed(2),
          total.toFixed(2),
          quotation.paymentTerms,
          quotation.deliveryTime,
        ]);
      }
    }
  } else {
    // No quotations yet - just list items
    for (const item of rfq.items) {
      rows.push([
        rfq._id,
        new Date(rfq.createdAt).toLocaleDateString(),
        item.productName,
        item.quantity.toString(),
        "Pending",
        "",
        "",
        "",
        "",
      ]);
    }
  }

  // Convert to CSV string
  const csvContent = rows
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");

  return csvContent;
}

export function exportOrderToCSV(order: {
  _id: string;
  orderDate: number;
  productName: string;
  quantity: number;
  totalAmount: number;
  vendorName: string;
  vendorCompany?: string;
  status: string;
  trackingNumber?: string;
  deliveryDate?: number;
}) {
  const rows: string[][] = [];
  
  // Header row - QuickBooks compatible format
  rows.push([
    "Order ID",
    "Order Date",
    "Vendor Name",
    "Vendor Company",
    "Product",
    "Quantity",
    "Unit Price",
    "Total Amount",
    "Status",
    "Tracking Number",
    "Delivery Date",
    "Memo",
  ]);

  const unitPrice = order.totalAmount / order.quantity;
  
  rows.push([
    order._id,
    new Date(order.orderDate).toLocaleDateString(),
    order.vendorName,
    order.vendorCompany || "",
    order.productName,
    order.quantity.toString(),
    unitPrice.toFixed(2),
    order.totalAmount.toFixed(2),
    order.status,
    order.trackingNumber || "",
    order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : "",
    `Medical Equipment Order - ${order.productName}`,
  ]);

  // Convert to CSV string
  const csvContent = rows
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");

  return csvContent;
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Export multiple orders as a single CSV for bulk import
export function exportOrdersToCSV(orders: Array<{
  _id: string;
  orderDate: number;
  productName: string;
  quantity: number;
  totalAmount: number;
  vendorName: string;
  vendorCompany?: string;
  status: string;
  trackingNumber?: string;
  deliveryDate?: number;
}>) {
  const rows: string[][] = [];
  
  // Header row
  rows.push([
    "Order ID",
    "Order Date",
    "Vendor Name",
    "Vendor Company",
    "Product",
    "Quantity",
    "Unit Price",
    "Total Amount",
    "Status",
    "Tracking Number",
    "Delivery Date",
    "Memo",
  ]);

  for (const order of orders) {
    const unitPrice = order.totalAmount / order.quantity;
    
    rows.push([
      order._id,
      new Date(order.orderDate).toLocaleDateString(),
      order.vendorName,
      order.vendorCompany || "",
      order.productName,
      order.quantity.toString(),
      unitPrice.toFixed(2),
      order.totalAmount.toFixed(2),
      order.status,
      order.trackingNumber || "",
      order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : "",
      `Medical Equipment Order - ${order.productName}`,
    ]);
  }

  // Convert to CSV string
  const csvContent = rows
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");

  return csvContent;
}