angular.module("pharmacyApp").service("InvoicesService", [
  "$http",
  "SUPABASE_CONFIG",
  function ($http, SUPABASE_CONFIG) {
    var headers = {
      apikey: SUPABASE_CONFIG.API_KEY,
      Authorization: "Bearer " + SUPABASE_CONFIG.API_KEY,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    };

    var invoicesUrl = SUPABASE_CONFIG.API_URL + "/invoices";
    var itemsUrl = SUPABASE_CONFIG.API_URL + "/invoice_items";

    this.createInvoice = function (invoice) {
      return $http.post(invoicesUrl, invoice, { headers: headers });
    };

    this.addItems = function (items) {
      return $http.post(itemsUrl, items, { headers: headers });
    };
  },
]);
