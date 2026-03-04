angular
  .module("pharmacyApp")
  // renamed service to match injection in controller
  .service("MedsService", [
    "$http",
    "SUPABASE_CONFIG",
    function ($http, SUPABASE_CONFIG) {
      const headers = {
        apikey: SUPABASE_CONFIG.API_KEY,
        Authorization: "Bearer " + SUPABASE_CONFIG.API_KEY,
        "Content-Type": "application/json",
      };

      // supabase requires a select parameter to return rows
      this.getAll = function () {
        return $http.get(SUPABASE_CONFIG.API_URL + "/medicines?select=*", {
          headers: headers,
        });
      };
    },
  ]);
