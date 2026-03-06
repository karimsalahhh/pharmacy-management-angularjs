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

    function clearForm(form) {
      $scope.newMed = { name: "", price: null, stock: null, expiry_date: "" };

      if (form) {
        form.$setPristine();
        form.$setUntouched();
      }
    }

    function loadMeds() {
      MedsService.getAll()
        .then(function (res) {
          $scope.medicines = res.data;
        })
        .catch(function (err) {
          console.error("Error loading medicines:", err);
        });
    }

    $scope.addMed = function (form) {
      // show validation messages if user clicked Add
      if (form && form.$invalid) {
        // mark fields as touched so red + messages appear
        form.name.$setTouched();
        form.price.$setTouched();
        form.stock.$setTouched();
        form.expiry.$setTouched();
        return;
      }

      var med = {
        name: ($scope.newMed.name || "").trim(),
        price: Number($scope.newMed.price),
        stock: Number($scope.newMed.stock),
        expiry_date: $scope.newMed.expiry_date,
      };

      MedsService.create(med)
        .then(function () {
          loadMeds();
          clearForm(form);
        })
        .catch(function (err) {
          console.error("Error adding medicine:", err);
        });
    };

    $scope.deleteMed = function (id) {
      if (!confirm("Delete this medicine?")) return;

      MedsService.remove(id)
        .then(function () {
          loadMeds();
        })
        .catch(function (err) {
          console.error("Error deleting medicine:", err);
        });
    };

    $scope.updateStock = function (m) {
      if (m._oldStock === m.stock) return;

      MedsService.update(m.id, { stock: m.stock })
        .catch(function (err) {
          console.error("Error updating stock:", err);
        });
    };

    // initial load
    loadMeds();
  },
]);