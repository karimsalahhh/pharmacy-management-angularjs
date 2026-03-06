<<<<<<< HEAD
//!This file contains the MedsService which is responsible for making API calls to the Supabase backend to
// !perform CRUD operations on the medicines data.
=======
>>>>>>> c0679cdb2554bfd280d899ae705dfb7f783ec221
angular.module("pharmacyApp").service("MedsService", [
  "$http",
  "SUPABASE_CONFIG",
  function ($http, SUPABASE_CONFIG) {
<<<<<<< HEAD
    var baseUrl = SUPABASE_CONFIG.API_URL + "medicines";
=======
>>>>>>> c0679cdb2554bfd280d899ae705dfb7f783ec221
    var headers = {
      apikey: SUPABASE_CONFIG.API_KEY,
      Authorization: "Bearer " + SUPABASE_CONFIG.API_KEY,
      "Content-Type": "application/json",
<<<<<<< HEAD
      Prefer: "return=representation",
    };

=======
    };

    var baseUrl = SUPABASE_CONFIG.API_URL + "/medicines";

>>>>>>> c0679cdb2554bfd280d899ae705dfb7f783ec221
    this.getAll = function () {
      return $http.get(baseUrl + "?select=*&order=id.asc", {
        headers: headers,
      });
    };

<<<<<<< HEAD
    this.create = function (medicine) {
      return $http.post(baseUrl, medicine, {
        headers: headers,
      });
    };

    this.update = function (id, medicine) {
      return $http.patch(baseUrl + "?id=eq." + id, medicine, {
=======
    this.create = function (med) {
      return $http.post(baseUrl, med, {
>>>>>>> c0679cdb2554bfd280d899ae705dfb7f783ec221
        headers: headers,
      });
    };

    this.remove = function (id) {
      return $http.delete(baseUrl + "?id=eq." + id, {
        headers: headers,
      });
    };
<<<<<<< HEAD
=======

    this.update = function (id, patch) {
      return $http.patch(baseUrl + "?id=eq." + id, patch, {
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
>>>>>>> c0679cdb2554bfd280d899ae705dfb7f783ec221
  },
]);
