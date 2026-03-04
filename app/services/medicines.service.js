angular
  .module("pharmacyApp")
  .service("MedicineService", function ($http, SUPABASE_CONFIG) {
    const headers = {
      apikey: SUPABASE_CONFIG.API_KEY,
      Authorization: "Bearer " + SUPABASE_CONFIG.API_KEY,
      "Content-Type": "application/json",
    };

    this.getAll = function () {
      return $http.get(SUPABASE_CONFIG.API_URL + "/medicines", {
        headers: headers,
      });
    };
  });
