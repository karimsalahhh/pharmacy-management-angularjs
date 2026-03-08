angular.module("pharmacyApp").controller("InvoicesDetailsController", [
  "$scope",
  "$q",
  "$location",
  "OrdersService",
  "CustomersService",
  "MedsService",
  function (
    $scope,
    $q,
    $location,
    OrdersService,
    CustomersService,
    MedsService,
  ) {
    $scope.invoices = [];
    $scope.loading = true;
    $scope.error = null;
    $scope.itemsByInvoice = {};
    $scope.invoiceActionLoading = {};
    $scope.selectedInvoice = null;
    $scope.filters = {
      query: "",
      paid: "all",
      fulfilled: "all",
      dateFrom: "",
      dateTo: "",
    };
    function applyRouteFilters() {
      var phoneFromRoute = $location.search().phone || "";
      if (phoneFromRoute) {
        $scope.filters.query = phoneFromRoute;
      }
    }

    function toNumber(v) {
      var n = Number(v);
      return isNaN(n) ? 0 : n;
    }

    function parseInvoiceNotes(notes) {
      var txt = typeof notes === "string" ? notes : "";
      var marker = "--INVOICE_META--";
      var idx = txt.indexOf(marker);
      var userNotes = idx === -1 ? txt : txt.substring(0, idx);
      userNotes = userNotes.replace(/\s+$/, "");
      var meta = { paid: false, fulfilled: false };

      if (idx !== -1) {
        var raw = txt.substring(idx + marker.length).trim();
        try {
          var parsed = JSON.parse(raw);
          if (typeof parsed.paid === "boolean") meta.paid = parsed.paid;
          if (typeof parsed.fulfilled === "boolean") {
            meta.fulfilled = parsed.fulfilled;
          }
        } catch (e) {}
      }

      return {
        userNotes: userNotes,
        meta: meta,
      };
    }

    function buildInvoiceNotes(userNotes, meta) {
      var cleanUserNotes = (userNotes || "").trim();
      var marker = "--INVOICE_META--";
      var metaJson = JSON.stringify({
        paid: !!meta.paid,
        fulfilled: !!meta.fulfilled,
      });
      if (cleanUserNotes)
        return cleanUserNotes + "\n\n" + marker + "\n" + metaJson;
      return marker + "\n" + metaJson;
    }

    function normalizeDate(v) {
      if (!v) return 0;
      var d = new Date(v).getTime();
      return isNaN(d) ? 0 : d;
    }

    function customerMap(customers) {
      var map = {};
      for (var i = 0; i < customers.length; i++) {
        map[toNumber(customers[i].id)] = customers[i];
      }
      return map;
    }

    function medicineMap(meds) {
      var map = {};
      for (var i = 0; i < meds.length; i++) {
        map[toNumber(meds[i].id)] = meds[i];
      }
      return map;
    }

    function groupItemsByInvoice(items, medsById) {
      var map = {};
      for (var i = 0; i < items.length; i++) {
        var it = angular.copy(items[i]);
        var med = medsById[toNumber(it.medicine_id)];
        it.medicine_name = med ? med.name : "Medicine #" + it.medicine_id;
        it.line_total = toNumber(it.qty) * toNumber(it.unit_price);

        if (!map[it.invoice_id]) map[it.invoice_id] = [];
        map[it.invoice_id].push(it);
      }
      return map;
    }

    function resolvePaidState(inv) {
      if (typeof inv.is_paid === "boolean") return inv.is_paid;
      if (typeof inv.paid === "boolean") return inv.paid;
      if (typeof inv.payment_status === "string") {
        return inv.payment_status.toLowerCase() === "paid";
      }
      return parseInvoiceNotes(inv.notes || "").meta.paid;
    }

    function resolveFulfilledState(inv) {
      if (typeof inv.is_done === "boolean") return inv.is_done;
      if (typeof inv.done === "boolean") return inv.done;
      if (typeof inv.is_fulfilled === "boolean") return inv.is_fulfilled;
      if (typeof inv.fulfilled === "boolean") return inv.fulfilled;
      if (typeof inv.status === "string") {
        return inv.status.toLowerCase() === "done";
      }
      return parseInvoiceNotes(inv.notes || "").meta.fulfilled;
    }

    function getPaidPatch(inv) {
      if (typeof inv.is_paid === "boolean") return { is_paid: !inv.is_paid };
      if (typeof inv.paid === "boolean") return { paid: !inv.paid };
      if (typeof inv.payment_status === "string") {
        return {
          payment_status:
            inv.payment_status.toLowerCase() === "paid" ? "unpaid" : "paid",
        };
      }
      var parsed = parseInvoiceNotes(inv.notes || "");
      parsed.meta.paid = !parsed.meta.paid;
      return { notes: buildInvoiceNotes(parsed.userNotes, parsed.meta) };
    }

    function getFulfilledPatch(inv) {
      if (typeof inv.is_done === "boolean") return { is_done: !inv.is_done };
      if (typeof inv.done === "boolean") return { done: !inv.done };
      if (typeof inv.is_fulfilled === "boolean") {
        return { is_fulfilled: !inv.is_fulfilled };
      }
      if (typeof inv.fulfilled === "boolean")
        return { fulfilled: !inv.fulfilled };
      if (typeof inv.status === "string") {
        return {
          status: inv.status.toLowerCase() === "done" ? "pending" : "done",
        };
      }
      var parsed = parseInvoiceNotes(inv.notes || "");
      parsed.meta.fulfilled = !parsed.meta.fulfilled;
      return { notes: buildInvoiceNotes(parsed.userNotes, parsed.meta) };
    }

    function syncSelectedInvoice(invoice) {
      if (
        $scope.selectedInvoice &&
        $scope.selectedInvoice.invoice &&
        $scope.selectedInvoice.invoice.id === invoice.id
      ) {
        $scope.selectedInvoice.invoice = invoice;
        $scope.selectedInvoice.items = $scope.getInvoiceItems(invoice.id);
        $scope.selectedInvoice.userNotes = parseInvoiceNotes(
          invoice.notes || "",
        ).userNotes;
      }
    }

    function loadAll() {
      $scope.loading = true;
      $scope.error = null;

      $q.all([
        CustomersService.getAll(),
        OrdersService.getAllOrders(),
        OrdersService.getAllItems(),
        MedsService.getAll(),
      ])
        .then(function (res) {
          var customers = (res[0] && res[0].data) || [];
          var orders = (res[1] && res[1].data) || [];
          var items = (res[2] && res[2].data) || [];
          var meds = (res[3] && res[3].data) || [];
          var customersById = customerMap(customers);
          var medsById = medicineMap(meds);

          var inv = [];
          for (var i = 0; i < orders.length; i++) {
            var clone = angular.copy(orders[i]);
            var c = customersById[toNumber(clone.customer_id)];
            clone.customer_name = c ? c.name : "Unknown customer";
            clone.customer_phone = c ? c.phone : "-";
            clone._paidState = resolvePaidState(clone);
            clone._fulfilledState = resolveFulfilledState(clone);
            inv.push(clone);
          }

          inv.sort(function (a, b) {
            var aDate = normalizeDate(a.created_at || a.date || a.invoice_date);
            var bDate = normalizeDate(b.created_at || b.date || b.invoice_date);
            if (aDate === bDate) return toNumber(b.id) - toNumber(a.id);
            return bDate - aDate;
          });

          $scope.invoices = inv;
          $scope.itemsByInvoice = groupItemsByInvoice(items, medsById);
          applyRouteFilters();
          $scope.loading = false;
        })
        .catch(function (err) {
          console.error("Load invoices details failed:", err);
          $scope.loading = false;
          $scope.error = "Failed to load invoices details.";
        });
    }

    $scope.getInvoiceItems = function (invoiceId) {
      return $scope.itemsByInvoice[invoiceId] || [];
    };

    $scope.getFilteredInvoices = function () {
      var q = ($scope.filters.query || "").toLowerCase().trim();
      var paidFilter = $scope.filters.paid;
      var fulfilledFilter = $scope.filters.fulfilled;
      var fromDate = $scope.filters.dateFrom
        ? new Date($scope.filters.dateFrom).getTime()
        : null;
      var toDate = $scope.filters.dateTo
        ? new Date($scope.filters.dateTo + "T23:59:59").getTime()
        : null;

      return $scope.invoices.filter(function (inv) {
        var invTime = normalizeDate(
          inv.created_at || inv.date || inv.invoice_date,
        );
        var paidOk =
          paidFilter === "all" ||
          (paidFilter === "paid" && inv._paidState === true) ||
          (paidFilter === "unpaid" && inv._paidState === false);
        var fulfilledOk =
          fulfilledFilter === "all" ||
          (fulfilledFilter === "done" && inv._fulfilledState === true) ||
          (fulfilledFilter === "pending" && inv._fulfilledState === false);
        var fromOk = fromDate === null || invTime >= fromDate;
        var toOk = toDate === null || invTime <= toDate;

        if (!paidOk || !fulfilledOk || !fromOk || !toOk) return false;
        if (!q) return true;

        var searchText = (
          "#" +
          inv.id +
          " " +
          (inv.customer_name || "") +
          " " +
          (inv.customer_phone || "") +
          " " +
          toNumber(inv.total).toFixed(2) +
          " " +
          (inv.created_at || inv.date || inv.invoice_date || "")
        ).toLowerCase();

        return searchText.indexOf(q) !== -1;
      });
    };

    $scope.resetFilters = function () {
      $scope.filters = {
        query: "",
        paid: "all",
        fulfilled: "all",
        dateFrom: "",
        dateTo: "",
      };
      $location.search("phone", null);
    };

    $scope.openInvoiceDetails = function (invoice) {
      $scope.selectedInvoice = {
        invoice: invoice,
        items: $scope.getInvoiceItems(invoice.id),
        userNotes: parseInvoiceNotes(invoice.notes || "").userNotes,
      };
    };

    $scope.closeInvoiceDetails = function () {
      $scope.selectedInvoice = null;
    };

    $scope.togglePaidStatus = function (invoice) {
      var patch = getPaidPatch(invoice);
      $scope.invoiceActionLoading[invoice.id] = true;

      OrdersService.updateOrder(invoice.id, patch)
        .then(function (res) {
          var updated =
            res && res.data && res.data.length > 0 ? res.data[0] : null;
          if (updated) angular.extend(invoice, updated);
          else angular.extend(invoice, patch);

          invoice._paidState = resolvePaidState(invoice);
          invoice._fulfilledState = resolveFulfilledState(invoice);
          syncSelectedInvoice(invoice);
        })
        .catch(function (err) {
          console.error("Failed updating paid status:", err);
          alert("Failed to update paid status.");
        })
        .finally(function () {
          $scope.invoiceActionLoading[invoice.id] = false;
        });
    };

    $scope.fulfillInvoice = function (invoice) {
      var patch = getFulfilledPatch(invoice);
      $scope.invoiceActionLoading[invoice.id] = true;

      OrdersService.updateOrder(invoice.id, patch)
        .then(function (res) {
          var updated =
            res && res.data && res.data.length > 0 ? res.data[0] : null;
          if (updated) angular.extend(invoice, updated);
          else angular.extend(invoice, patch);

          invoice._paidState = resolvePaidState(invoice);
          invoice._fulfilledState = resolveFulfilledState(invoice);
          syncSelectedInvoice(invoice);
        })
        .catch(function (err) {
          console.error("Failed toggling fulfillment:", err);
          alert("Failed to toggle fulfillment status.");
        })
        .finally(function () {
          $scope.invoiceActionLoading[invoice.id] = false;
        });
    };

    loadAll();
  },
]);
