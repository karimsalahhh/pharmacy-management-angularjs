angular.module("pharmacyApp").controller("RegisterController", [
  "$scope",
  function ($scope) {
    $scope.registerData = {
      name: "",
      email: "",
      password: "",
    };

    $scope.register = function () {
      // TODO: Implement register logic
      console.log("Register attempt", $scope.registerData);
    };
  },
]);
