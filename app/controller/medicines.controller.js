angular
  .module("pharmacyApp")
  .controller("MedicineController", function ($scope, MedicineService) {
    $scope.medicines = [];

    MedicineService.getAll()
      .then(function (response) {
        $scope.medicines = response.data;
      })
      .catch(function (error) {
        console.error("Error fetching medicines:", error);
      });
  });
