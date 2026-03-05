angular.module("pharmacyApp").controller("MedicineController", [
  "$scope",
  "MedsService",
  function ($scope, MedsService) {
    $scope.medicines = [];
    $scope.newMed = {
      name: "",
      price: null,
      stock: null,
      expiry_date: "",
    };

    $scope.addMed = function () {
      MedsService.create($scope.newMed)
        .then(function () {
          return MedsService.getAll();
        })
        .then(function (response) {
          $scope.medicines = response.data;
          $scope.newMed = {
            name: "",
            price: null,
            stock: null,
            expiry_date: "",
          };
        })
        .catch(function (error) {
          console.error("Error adding medicine:", error);
        });
    };
    MedsService.getAll()
      .then(function (response) {
        $scope.medicines = response.data;
      })
      .catch(function (error) {
        console.error("Error fetching medicines:", error);
      });
  },
]);
