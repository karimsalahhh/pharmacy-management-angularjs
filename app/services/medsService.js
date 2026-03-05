angular.module("pharmacyApp").service("MedsService", [
  "$http",
  "SUPABASE_CONFIG",
  function ($http, SUPABASE_CONFIG) {
    const headers = {
      apikey: SUPABASE_CONFIG.API_KEY,
      Authorization: "Bearer " + SUPABASE_CONFIG.API_KEY,
      "Content-Type": "application/json",
    };

    this.getAll = function () {
      return $http.get(SUPABASE_CONFIG.API_URL + "/medicines?select=*", {
        headers: headers,
      });
    };

    this.create = function (med) {
      return $http.post(SUPABASE_CONFIG.API_URL + "/medicines", med, {
        headers: headers,
      });
    };
    this.remove = function (id) {
      return $http.delete(SUPABASE_CONFIG.API_URL + "/medicines?id=eq." + id, {
        headers: headers,
      });
    };
    this.update = function (id, patch) {
      return $http.patch(
        SUPABASE_CONFIG.API_URL + "/medicines?id=eq." + id,
        patch,
        { headers: headers },
      );
    };
  },
]);
