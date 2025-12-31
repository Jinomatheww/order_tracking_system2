import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { FilterMatchMode } from "primereact/api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "primereact/button";

export default function OrderTable({
  orders = [],
  statuses = [],
  merchants = [],
  isOps = false,
}) {
  const navigate = useNavigate();
  const safeOrders = Array.isArray(orders) ? orders : [];

  const [filters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    order_id: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    merchant_name: { value: null, matchMode: FilterMatchMode.EQUALS },
    customer_contact: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    current_status: { value: null, matchMode: FilterMatchMode.EQUALS },
  });

  const getStatusSeverity = (status) => {
    switch (status) {
      case "created":
        return "info";
      case "picked_up":
        return "warning";
      case "in_transit":
        return "warning";
      case "delivered":
        return "success";
      case "cancelled":
        return "danger";
      default:
        return "secondary";
    }
  };

  const formatDate = (value, withTime = false) => {
    if (!value) return "-";
    const date = new Date(value);
    if (isNaN(date.getTime())) return "-";
    return withTime
      ? date.toLocaleString()
      : date.toLocaleDateString();
  };

  const statusBodyTemplate = (row) => {
    const status =
      typeof row?.current_status === "string"
        ? row.current_status
        : "unknown";

    return (
      <Tag
        value={status}
        severity={getStatusSeverity(status)}
      />
    );
  };


  const statusRowFilterTemplate = (options) => (
    <Dropdown
      value={options.value}
      options={statuses}
      onChange={(e) => options.filterApplyCallback(e.value)}
      placeholder="Select Status"
      className="p-column-filter"
      showClear
      style={{ minWidth: "12rem" }}
    />
  );

 
  const merchantRowFilterTemplate = (options) => (
    <Dropdown
      value={options.value}
      options={merchants}
      onChange={(e) => options.filterApplyCallback(e.value)}
      placeholder="Select Merchant"
      className="p-column-filter"
      showClear
      style={{ minWidth: "12rem" }}
    />
  );

  return (
    <div className="card">
      <DataTable
        value={safeOrders}
        paginator
        rows={10}
        rowsPerPageOptions={[10, 25, 50]}
        filters={filters}
        filterDisplay="row"
        globalFilterFields={[
          "order_id",
          "merchant_name",
          "customer_contact",
          "current_status",
        ]}
        emptyMessage="No orders found"
      >
        <Column
          field="order_id"
          header="Order ID"
          sortable
          filter
          filterPlaceholder="Search by Order ID"
        />

        <Column
          field="merchant_name"
          header="Merchant"
          sortable
          filter={isOps}
          filterElement={merchantRowFilterTemplate}
        />

        <Column
          field="customer_contact"
          header="Contact"
          sortable
          filter
          filterPlaceholder="Search by Contact"
          body={(row) =>
            row?.customer_contact
              ? String(row.customer_contact)
              : "-"
          }
        />

        <Column
          field="current_status"
          header="Status"
          sortable
          body={statusBodyTemplate}
          filter
          filterElement={statusRowFilterTemplate}
        />

        <Column
          header="Created"
          sortable
          body={(row) => formatDate(row?.created_at)}
        />

        <Column
          header="Updated"
          sortable
          body={(row) => formatDate(row?.updated_at, true)}
        />

        <Column
          header="Action"
          body={(row) => (
            <Button
              label="View"
              className="p-button-sm p-button-info"
              onClick={() =>
                row?.order_id && navigate(`/orders/${row.order_id}`)
              }
            />
          )}
        />
      </DataTable>
    </div>
  );
}



























































