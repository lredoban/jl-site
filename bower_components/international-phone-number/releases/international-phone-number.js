(function() {
  "use strict";
  angular.module("internationalPhoneNumber", []).directive('internationalPhoneNumber', [
    '$timeout', function($timeout) {
      return {
        restrict: 'A',
        require: '^ngModel',
        scope: {
          ngModel: '=',
          defaultCountry: '@'
        },
        link: function(scope, element, attrs, ctrl) {
          var handleWhatsSupposedToBeAnArray, options, read, watchOnce;
          if (ctrl) {
            if (element.val() !== '') {
              $timeout(function() {
                element.intlTelInput('setNumber', element.val());
                return ctrl.$setViewValue(element.val());
              }, 0);
            }
          }
          read = function() {
            return ctrl.$setViewValue(element.val());
          };
          handleWhatsSupposedToBeAnArray = function(value) {
            if (value instanceof Array) {
              return value;
            } else {
              return value.toString().replace(/[ ]/g, '').split(',');
            }
          };
          options = {
            autoFormat: true,
            autoHideDialCode: true,
            defaultCountry: '',
            nationalMode: false,
            numberType: '',
            onlyCountries: void 0,
            preferredCountries: ['us', 'gb'],
            responsiveDropdown: false,
            utilsScript: ""
          };
          angular.forEach(options, function(value, key) {
            var option;
            if (!(attrs.hasOwnProperty(key) && angular.isDefined(attrs[key]))) {
              return;
            }
            option = attrs[key];
            if (key === 'preferredCountries') {
              return options.preferredCountries = handleWhatsSupposedToBeAnArray(option);
            } else if (key === 'onlyCountries') {
              return options.onlyCountries = handleWhatsSupposedToBeAnArray(option);
            } else if (typeof value === "boolean") {
              return options[key] = option === "true";
            } else {
              return options[key] = option;
            }
          });
          watchOnce = scope.$watch('ngModel', function(newValue) {
            return scope.$$postDigest(function() {
              options.defaultCountry = scope.defaultCountry;
              if (newValue !== null && newValue !== void 0 && newValue !== '') {
                element.val(newValue);
              }
              element.intlTelInput(options);
              if (!(attrs.skipUtilScriptDownload !== void 0 || options.utilsScript)) {
                element.intlTelInput('loadUtils', '/bower_components/intl-tel-input/lib/libphonenumber/build/utils.js');
              }
              return watchOnce();
            });
          });
          ctrl.$formatters.push(function(value) {
            if (!value) {
              return value;
            }
            element.intlTelInput('setNumber', value);
            return element.val();
          });
          ctrl.$parsers.push(function(value) {
            if (!value) {
              return value;
            }
            return value.replace(/[^\d]/g, '');
          });
          ctrl.$validators.internationalPhoneNumber = function(value) {
            var selectedCountry;
            selectedCountry = element.intlTelInput('getSelectedCountryData');
            if (!value || (selectedCountry && selectedCountry.dialCode === value)) {
              return true;
            }
            return element.intlTelInput("isValidNumber");
          };
          element.on('blur keyup change', function(event) {
            return scope.$apply(read);
          });
          return element.on('$destroy', function() {
            element.intlTelInput('destroy');
            return element.off('blur keyup change');
          });
        }
      };
    }
  ]);

}).call(this);
