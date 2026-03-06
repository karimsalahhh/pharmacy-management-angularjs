//!This file contains the MedsService which is responsible for making API calls to the Supabase backend to
// !perform CRUD operations on the medicines data.
angular.module("pharmacyApp").service("MedsService", [
  "$http",
  "SUPABASE_CONFIG",
  function ($http, SUPABASE_CONFIG) {
    var baseUrl = SUPABASE_CONFIG.API_URL + "medicines";
    var headers = {
      apikey: SUPABASE_CONFIG.API_KEY,
      Authorization: "Bearer " + SUPABASE_CONFIG.API_KEY,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    };

    this.getAll = function () {
      return $http.get(baseUrl + "?select=*&order=id.asc", {
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
  },
]);
