angular.module("pharmacyApp").service("OrdersService", [
  "$http",
  "SUPABASE_CONFIG",
  function ($http, SUPABASE_CONFIG) {
    var headers = {
      apikey: SUPABASE_CONFIG.API_KEY,
      Authorization: "Bearer " + SUPABASE_CONFIG.API_KEY,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    };

    var ordersUrl = SUPABASE_CONFIG.API_URL + "/invoices";
    var itemsUrl = SUPABASE_CONFIG.API_URL + "/invoice_items";

    this.createOrder = function (order) {
      return $http.post(ordersUrl, order, { headers: headers });
    };

    this.addItems = function (items) {
      return $http.post(itemsUrl, items, { headers: headers });
    };

    this.getAllOrders = function () {
      return $http.get(ordersUrl + "?select=*&order=id.asc", {
        headers: headers,
      });
    };

    this.getAllItems = function () {
      return $http.get(itemsUrl + "?select=*&order=id.asc", {
        headers: headers,
      });
    };

    this.updateOrder = function (id, payload) {
      return $http.patch(ordersUrl + "?id=eq." + id, payload, {
        headers: headers,
      });
    };
  },
]);
