angular.module("pharmacyApp").config([
  "$routeProvider",
  function ($routeProvider) {
    $routeProvider
      .when("/dashboard", {
        templateUrl: "app/views/dashboard.html",
        controller: "dashCTRL",
      })
      .when("/statistics", {
        templateUrl: "app/views/statistics.html",
        controller: "statsCTRL",
      })
      .when("/medicines", {
        templateUrl: "app/views/medicines.html",
        controller: "medsCTRL",
      })
      .when("/productSearch", {
        templateUrl: "app/views/productSearch.html",
        controller: "prodsCTRL",
      })
      .otherwise({
        redirectTo: "/dashboard",
      });
  },
]);
