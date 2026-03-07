angular.module("pharmacyApp").service("AdminInsightsService", [
  "$q",
  "MedsService",
  "CustomersService",
  "OrdersService",
  function ($q, MedsService, CustomersService, OrdersService) {
    var cache = null;
    var cacheAt = 0;
    var inFlight = null;
    var CACHE_TTL_MS = 30000;

    function toNumber(v) {
      var n = Number(v);
      return isNaN(n) ? 0 : n;
    }

    function toTime(v) {
      if (!v) return 0;
      var t = new Date(v).getTime();
      return isNaN(t) ? 0 : t;
    }

    function parseInvoiceMeta(notes) {
      var txt = typeof notes === "string" ? notes : "";
      var marker = "--INVOICE_META--";
      var idx = txt.indexOf(marker);
      var fallback = { paid: false, fulfilled: false };

      if (idx === -1) return fallback;

      try {
        var raw = txt.substring(idx + marker.length).trim();
        var parsed = JSON.parse(raw);
        return {
          paid: !!parsed.paid,
          fulfilled: !!parsed.fulfilled,
        };
      } catch (e) {
        return fallback;
      }
    }

    function resolvePaidState(inv) {
      if (typeof inv.is_paid === "boolean") return inv.is_paid;
      if (typeof inv.paid === "boolean") return inv.paid;
      if (typeof inv.payment_status === "string") {
        return inv.payment_status.toLowerCase() === "paid";
      }
      return parseInvoiceMeta(inv.notes || "").paid;
    }

    function resolveFulfilledState(inv) {
      if (typeof inv.is_done === "boolean") return inv.is_done;
      if (typeof inv.done === "boolean") return inv.done;
      if (typeof inv.is_fulfilled === "boolean") return inv.is_fulfilled;
      if (typeof inv.fulfilled === "boolean") return inv.fulfilled;
      if (typeof inv.status === "string") {
        return inv.status.toLowerCase() === "done";
      }
      return parseInvoiceMeta(inv.notes || "").fulfilled;
    }

    function buildCustomerMap(customers) {
      var map = {};
      for (var i = 0; i < customers.length; i++) {
        map[toNumber(customers[i].id)] = customers[i];
      }
      return map;
    }

    function groupItemsByInvoice(items) {
      var map = {};
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        var invId = toNumber(it.invoice_id);
        if (!map[invId]) map[invId] = [];
        map[invId].push(it);
      }
      return map;
    }

    function getDateKey(dateValue) {
      var d = new Date(dateValue);
      if (isNaN(d.getTime())) return null;
      var y = d.getFullYear();
      var m = ("0" + (d.getMonth() + 1)).slice(-2);
      var day = ("0" + d.getDate()).slice(-2);
      return y + "-" + m + "-" + day;
    }

    function fetchInsights() {
      return $q
        .all({
          medicines: MedsService.getAll(),
          customers: CustomersService.getAll(),
          orders: OrdersService.getAllOrders(),
          items: OrdersService.getAllItems(),
        })
        .then(function (results) {
          var meds = (results.medicines && results.medicines.data) || [];
          var customers = (results.customers && results.customers.data) || [];
          var orders = (results.orders && results.orders.data) || [];
          var items = (results.items && results.items.data) || [];
          var customersById = buildCustomerMap(customers);
          var itemsByInvoice = groupItemsByInvoice(items);

          var today = new Date();
          var todayStart = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
          ).getTime();
          var next30Days = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() + 30,
          ).getTime();

          var inventory = {
            totalMedicines: meds.length,
            totalStockUnits: 0,
            totalInventoryValue: 0,
            averagePrice: 0,
            availableCount: 0,
            lowStockCount: 0,
            outOfStockCount: 0,
            expiringSoonCount: 0,
            lowStockMedicines: [],
            expiringSoonMedicines: [],
          };

          var totalPrices = 0;
          for (var i = 0; i < meds.length; i++) {
            var med = meds[i];
            var stock = toNumber(med.stock);
            var price = toNumber(med.price);
            var expiryTime = toTime(med.expiry_date);

            inventory.totalStockUnits += stock;
            inventory.totalInventoryValue += stock * price;
            totalPrices += price;

            if (stock === 0) {
              inventory.outOfStockCount++;
              inventory.lowStockMedicines.push(med);
            } else if (stock <= 10) {
              inventory.lowStockCount++;
              inventory.lowStockMedicines.push(med);
            } else {
              inventory.availableCount++;
            }

            if (
              expiryTime &&
              expiryTime >= todayStart &&
              expiryTime <= next30Days
            ) {
              inventory.expiringSoonCount++;
              inventory.expiringSoonMedicines.push(med);
            }
          }

          inventory.averagePrice =
            inventory.totalMedicines > 0
              ? totalPrices / inventory.totalMedicines
              : 0;

          var normalizedOrders = [];
          var sales = {
            totalInvoices: 0,
            totalRevenue: 0,
            averageInvoiceValue: 0,
            paidCount: 0,
            unpaidCount: 0,
            fulfilledCount: 0,
            unfulfilledCount: 0,
            todayRevenue: 0,
          };

          var medicineSales = {};
          var customerTotals = {};
          var revenueByDay = {};

          for (var j = 0; j < orders.length; j++) {
            var order = orders[j];
            var customer = customersById[toNumber(order.customer_id)];
            var total = toNumber(order.total);
            var createdAt = order.created_at || order.date || order.invoice_date;
            var createdTime = toTime(createdAt);
            var paid = resolvePaidState(order);
            var fulfilled = resolveFulfilledState(order);
            var orderItems = itemsByInvoice[toNumber(order.id)] || [];

            normalizedOrders.push({
              id: order.id,
              customer_id: order.customer_id,
              customer_name: customer ? customer.name : "Unknown customer",
              customer_phone: customer ? customer.phone : "-",
              total: total,
              created_at: createdAt,
              created_time: createdTime,
              paid: paid,
              fulfilled: fulfilled,
              notes: order.notes || "",
              item_count: orderItems.length,
            });

            sales.totalInvoices++;
            sales.totalRevenue += total;
            if (paid) sales.paidCount++;
            else sales.unpaidCount++;
            if (fulfilled) sales.fulfilledCount++;
            else sales.unfulfilledCount++;
            if (createdTime >= todayStart) sales.todayRevenue += total;

            var dayKey = getDateKey(createdAt);
            if (dayKey) {
              if (!revenueByDay[dayKey]) revenueByDay[dayKey] = 0;
              revenueByDay[dayKey] += total;
            }

            if (!customerTotals[order.customer_id]) {
              customerTotals[order.customer_id] = 0;
            }
            customerTotals[order.customer_id] += total;
          }

          sales.averageInvoiceValue =
            sales.totalInvoices > 0 ? sales.totalRevenue / sales.totalInvoices : 0;

          for (var k = 0; k < items.length; k++) {
            var item = items[k];
            if (!medicineSales[item.medicine_id]) medicineSales[item.medicine_id] = 0;
            medicineSales[item.medicine_id] += toNumber(item.qty);
          }

          var topMedicines = Object.keys(medicineSales)
            .map(function (medId) {
              var med = meds.find(function (m) {
                return toNumber(m.id) === toNumber(medId);
              });
              return {
                id: toNumber(medId),
                name: med ? med.name : "Medicine #" + medId,
                soldQty: medicineSales[medId],
              };
            })
            .sort(function (a, b) {
              return b.soldQty - a.soldQty;
            })
            .slice(0, 8);

          var topCustomers = Object.keys(customerTotals)
            .map(function (customerId) {
              var c = customersById[toNumber(customerId)];
              return {
                id: toNumber(customerId),
                name: c ? c.name : "Customer #" + customerId,
                totalSpent: customerTotals[customerId],
              };
            })
            .sort(function (a, b) {
              return b.totalSpent - a.totalSpent;
            })
            .slice(0, 8);

          normalizedOrders.sort(function (a, b) {
            if (a.created_time === b.created_time) return toNumber(b.id) - toNumber(a.id);
            return b.created_time - a.created_time;
          });

          var unfulfilledInvoices = normalizedOrders.filter(function (o) {
            return !o.fulfilled;
          });

          var revenueSeries = Object.keys(revenueByDay)
            .sort()
            .map(function (day) {
              return { day: day, value: revenueByDay[day] };
            });

          return {
            raw: {
              medicines: meds,
              customers: customers,
              orders: orders,
              items: items,
            },
            inventory: inventory,
            sales: sales,
            revenueSeries: revenueSeries,
            topMedicines: topMedicines,
            topCustomers: topCustomers,
            ordersNormalized: normalizedOrders,
            unfulfilledInvoices: unfulfilledInvoices,
          };
        });
    }

    this.getInsights = function (options) {
      var opts = options || {};
      var force = !!opts.forceRefresh;
      var now = Date.now();

      if (!force && cache && now - cacheAt < CACHE_TTL_MS) {
        return $q.when(cache);
      }

      if (!force && inFlight) return inFlight;

      inFlight = fetchInsights()
        .then(function (data) {
          cache = data;
          cacheAt = Date.now();
          return data;
        })
        .finally(function () {
          inFlight = null;
        });

      return inFlight;
    };
  },
]);
