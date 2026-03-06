angular.module("pharmacyApp").service("CustomersService", [
  "$http",
  "SUPABASE_CONFIG",
  function ($http, SUPABASE_CONFIG) {
    var headers = {
      apikey: SUPABASE_CONFIG.API_KEY,
      Authorization: "Bearer " + SUPABASE_CONFIG.API_KEY,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    };

    var baseUrl = SUPABASE_CONFIG.API_URL + "/customers";

    this.getAll = function () {
      return $http.get(baseUrl + "?select=*&order=id.asc", {
        headers: headers,
      });
    };

    this.create = function (customer) {
      var h = angular.copy(headers);
      h.Prefer = "return=representation";

      return $http.post(baseUrl, customer, { headers: h });
    };

    this.remove = function (id) {
      return $http.delete(baseUrl + "?id=eq." + id, { headers: headers });
    };
    this.findByPhone = function (phone) {
      var p = encodeURIComponent(phone);

      return $http.get(baseUrl + "?select=*&phone=eq." + p + "&limit=1", {
        headers: headers,
      });
    };
  },
]);
