angular.module("pharmacyApp").controller("MedicineController", [
  "$scope",
  "MedsService",
  function ($scope, MedsService) {
    // controller for medicines page
    $scope.medicines = [];

    // fetch all medicines via service
    MedsService.getAll()
      .then(function (response) {
        $scope.medicines = response.data;
      })
      .catch(function (error) {
        console.error("Error fetching medicines:", error);
      });
  },
]);
