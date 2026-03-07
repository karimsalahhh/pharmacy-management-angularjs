angular.module("pharmacyApp").service("MedsService", [
  "$http",
  "SUPABASE_CONFIG",
  function ($http, SUPABASE_CONFIG) {
    var headers = {
      apikey: SUPABASE_CONFIG.API_KEY,
      Authorization: "Bearer " + SUPABASE_CONFIG.API_KEY,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    };

    var baseUrl = SUPABASE_CONFIG.API_URL + "/medicines";

    this.getAll = function () {
      return $http.get(baseUrl + "?select=*&order=id.desc", {
        headers: headers,
      });
    };

    this.create = function (medicine) {
      return $http.post(baseUrl, medicine, {
        headers: headers,
      });
    };

    this.update = function (id, medicine) {
      return $http.patch(baseUrl + "?id=eq." + id, medicine, {
        headers: headers,
      });
    };

    this.remove = function (id) {
      return $http.delete(baseUrl + "?id=eq." + id, {
        headers: headers,
      });
    };

    this.getById = function (id) {
      return $http.get(baseUrl + "?select=*&id=eq." + id + "&limit=1", {
        headers: headers,
      });
    };

    this.searchByName = function (q) {
      var text = (q || "").trim();
      if (!text) return Promise.resolve({ data: [] });

      return $http.get(
        baseUrl +
          "?select=*&name=ilike.*" +
          encodeURIComponent(text) +
          "*&order=name.asc&limit=10",
        { headers: headers },
      );
    };
  },
]);
