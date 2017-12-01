/*
 * This file is part of the Sylius package.
 *
 * (c) Paweł Jędrzejewski
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

(function ($) {
    $(document).ready(function () {
        $('#sidebar').addClass('visible');
        $('#sidebar').first().sidebar('attach events', '#sidebar-toggle', 'toggle');
        $('#sidebar').first().sidebar('setting', {dimPage: false});

        $('.ui.checkbox').checkbox();
        $('.ui.accordion').accordion();
        $('.ui.menu .dropdown').dropdown({action: 'hide'});
        $('.ui.inline.dropdown').dropdown();
        $('.link.ui.dropdown').dropdown({action: 'hide'});
        $('.button.ui.dropdown').dropdown({action: 'hide'});
        $('.ui.fluid.search.selection.ui.dropdown').dropdown();
        $('.menu .item').tab();
        $('.card .image').dimmer({on: 'hover'});
        $('.ui.rating').rating('disable');

        $('form.loadable button').on('click', function () {
            return $(this).closest('form').addClass('loading');
        });
        $('.loadable.button').on('click', function () {
            return $(this).addClass('loading');
        });
        $('.message .close').on('click', function () {
            return $(this).closest('.message').transition('fade');
        });

        $('[data-requires-confirmation]').requireConfirmation();
        $('[data-toggles]').toggleElement();

        $('.special.cards .image').dimmer({
            on: 'hover'
        });

        $('[data-form-type="collection"]').CollectionForm();

    });
})(jQuery);

/*
 * This file is part of the Sylius package.
 *
 * (c) Paweł Jędrzejewski
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

(function ($) {
    'use strict';

    $.fn.extend({
        apiLogin: function (apiSettings) {
            var element = $(this);
            var apiSettings = apiSettings;
            var passwordField = element.find('input[type=\'password\']');
            var emailField = element.find('input[type=\'email\']');
            var csrfTokenField = element.find('input[type=\'hidden\']');
            var signInButton = element.find('.button');
            var validationField = element.find('.red.label');

            signInButton.api({
                method: apiSettings.method,
                dataType: apiSettings.dataType || 'json',
                throttle: apiSettings.throttle || 0,
                debug: apiSettings.debug || false,

                beforeSend: function (settings) {
                    settings.data = {
                        _username: emailField.val(),
                        _password: passwordField.val()
                    };
                    settings.data[csrfTokenField.attr('name')] = csrfTokenField.val();

                    return settings;
                },

                successTest: function (response) {
                    return response.success;
                },

                onSuccess: function (response) {
                    element.remove();
                    location.reload();
                },

                onFailure: function (response) {
                    validationField.removeClass('hidden');
                    validationField.html(response.message);
                }
            });

        }
    });
})(jQuery);

/*
 * This file is part of the Sylius package.
 *
 * (c) Paweł Jędrzejewski
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

(function ($) {
    'use strict';

    $.fn.extend({
        apiToggle: function (apiSettings, toggleableElement, isHidden) {
            var element = $(this);
            var apiSettings = apiSettings;
            var toggleableElement = toggleableElement;
            var isHidden = isHidden || true;

            if (isHidden) {
                toggleableElement.hide();
            }

            element.api({
                method: apiSettings.method,
                dataType: apiSettings.dataType || 'json',
                throttle: apiSettings.throttle || 0,
                debug: apiSettings.debug || false,

                beforeSend: apiSettings.beforeSend,
                successTest: apiSettings.successTest,

                onSuccess: function (response) {
                    toggleableElement.show();
                },

                onFailure: function (response) {
                    toggleableElement.hide();
                }
            });

        }
    });
})(jQuery);

/*
 * This file is part of the Sylius package.
 *
 * (c) Paweł Jędrzejewski
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

(function ($) {
    'use strict';

    $.fn.extend({
        autoComplete: function () {
            $(this).each(function () {
                var element = $(this);
                var criteriaName = $(this).data('criteria-name');
                var choiceName = $(this).data('choice-name');
                var choiceValue = $(this).data('choice-value');
                var autocompleteValue = $(this).find('input.autocomplete').val();
                var loadForEditUrl = $(this).data('load-edit-url');

                element.dropdown({
                    delay: {
                        search: 250
                    },
                    forceSelection: false,
                    apiSettings: {
                        dataType: 'JSON',
                        cache: false,
                        beforeSend: function (settings) {
                            settings.data[criteriaName] = settings.urlData.query;

                            return settings;
                        },
                        onResponse: function (response) {
                            var choiceName = element.data('choice-name');
                            var choiceValue = element.data('choice-value');
                            var myResults = [];
                            $.each(response, function (index, item) {
                                myResults.push({
                                    name: item[choiceName],
                                    value: item[choiceValue]
                                });
                            });

                            return {
                                success: true,
                                results: myResults
                            };
                        }
                    }
                });

                if (0 < autocompleteValue.split(',').length) {
                    var menuElement = element.find('div.menu');

                    menuElement.api({
                        on: 'now',
                        method: 'GET',
                        url: loadForEditUrl,
                        beforeSend: function (settings) {
                            settings.data[choiceValue] = autocompleteValue.split(',');

                            return settings;
                        },
                        onSuccess: function (response) {
                            $.each(response, function (index, item) {
                                menuElement.append(
                                    $('<div class="item" data-value="' + item[choiceValue] + '">' + item[choiceName] + '</div>')
                                );
                            });
                        }
                    });
                }

                window.setTimeout(function () {
                    element.dropdown('set selected', element.find('input.autocomplete').val().split(','));
                }, 5000);
            });
        }
    });
})(jQuery);

/*
 * This file is part of the Sylius package.
 *
 * (c) Paweł Jędrzejewski
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * @author Arnaud Langlade <arn0d.dev@gmail.com>
 */
!function ($) {

    "use strict";

    /**
     * Collection Form plugin
     *
     * @param element
     * @constructor
     */
    var CollectionForm = function (element) {
        this.$element = $(element);
        this.$list = this.$element.find('[data-form-collection="list"]:first');
        this.count = this.$list.children().length;
        this.lastChoice = null;

        this.$element.on(
            'click',
            '[data-form-collection="add"]:first',
            $.proxy(this.addItem, this)
        );

        this.$element.on(
            'click',
            '[data-form-collection="delete"]',
            $.proxy(this.deleteItem, this)
        );

        this.$element.on(
            'change',
            '[data-form-collection="update"]',
            $.proxy(this.updateItem, this)
        );

        $(document).on(
            'change',
            '[data-form-prototype="update"]',
            $.proxy(this.updatePrototype, this)
        );

        $(document).on('collection-form-add', function (e, addedElement) {
            $(addedElement).find('[data-form-type="collection"]').CollectionForm();
            $(document).trigger('dom-node-inserted', [$(addedElement)]);
        });
    }
    CollectionForm.prototype = {
        constructor: CollectionForm,

        /**
         * Add a item to the collection.
         * @param event
         */
        addItem: function (event) {
            event.preventDefault();

            var prototype = this.$element.data('prototype');

            prototype = prototype.replace(
                /__name__/g,
                this.count
            );

            this.$list.append(prototype);
            this.count = this.count + 1;

            $(document).trigger('collection-form-add', [this.$list.children().last()]);
        },

        /**
         * Update item from the collection
         */
        updateItem: function (event) {
            event.preventDefault();
            var $element = $(event.currentTarget),
                url = $element.data('form-url'),
                value = $element.val(),
                $container = $element.closest('[data-form-collection="item"]'),
                index = $container.data('form-collection-index'),
                position = $container.data('form-collection-index');
            if (url) {
                $container.load(url, {'id': value, 'position': position});
            } else {
                var prototype = this.$element.find('[data-form-prototype="' + value + '"]').val();

                prototype = prototype.replace(
                    /__name__/g,
                    index
                );

                $container.replaceWith(prototype);
            }
            $(document).trigger('collection-form-update', [$(event.currentTarget)]);
        },

        /**
         * Delete item from the collection
         * @param event
         */
        deleteItem: function (event) {
            event.preventDefault();

            $(event.currentTarget)
                .closest('[data-form-collection="item"]')
                .remove();

            $(document).trigger('collection-form-delete', [$(event.currentTarget)]);
        },

        /**
         * Update the prototype
         * @param event
         */
        updatePrototype: function (event) {
            var $target = $(event.currentTarget);
            var prototypeName = $target.val();

            if (undefined !== $target.data('form-prototype-prefix')) {
                prototypeName = $target.data('form-prototype-prefix') + prototypeName;
            }

            if (null !== this.lastChoice && this.lastChoice !== prototypeName) {
                this.$list.html('');
            }

            this.lastChoice = prototypeName;

            this.$element.data(
                'prototype',
                this.$element.find('[data-form-prototype="' + prototypeName + '"]').val()
            );
        }
    };

    /*
     * Plugin definition
     */

    $.fn.CollectionForm = function (option) {
        return this.each(function () {
            var $this = $(this);
            var data = $this.data('collectionForm');
            var options = typeof option == 'object' && option;

            if (!data) {
                $this.data(
                    'collectionForm',
                    (data = new CollectionForm(this, options))
                )
            }
        })
    };

    $.fn.CollectionForm.Constructor = CollectionForm;

}(jQuery);

/*
 * This file is part of the Sylius package.
 *
 * (c) Paweł Jędrzejewski
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

(function ($) {
    'use strict';

    $.fn.extend({
        productAttributes: function () {
            setAttributeChoiceListener();

            $(this).dropdown({
                onRemove: function (removedValue, removedText, $removedChoice) {
                    modifyAttributesListOnSelectorElementDelete(removedValue);
                },
                forceSelection: false
            });

            controlAttributesList();
            modifySelectorOnAttributesListElementDelete();
        }
    });

    function addAttributesNumber(number) {
        var currentIndex = parseInt(getNextIndex());
        $('#attributesContainer').attr('data-count', currentIndex + number);
    }

    function getNextIndex() {
        return $('#attributesContainer').attr('data-count');
    }

    function controlAttributesList() {
        $('#attributesContainer .attribute').each(function () {
            var value = $(this).attr('data-id');
            $('#sylius_product_attribute_choice').dropdown('set selected', value);
        });
    }

    function modifyAttributesListOnSelectorElementDelete(removedValue) {
        $('#attributesContainer .attribute[data-id="' + removedValue + '"]').remove();
    }

    function modifySelectorOnAttributesListElementDelete() {
        $('.attribute button').off('click').on('click', function () {
            var attributeId = $(this).parents('.attribute').attr('data-id');

            $('div#attributeChoice > .ui.dropdown.search').dropdown('remove selected', attributeId);
            modifyAttributesListOnSelectorElementDelete(attributeId)
        });
    }

    function modifyAttributeForms(data) {
        $.each($(data).find('input,select,textarea'), function () {
            if ($(this).attr('data-name') != null) {
                $(this).attr('name', $(this).attr('data-name'));
            }
        });

        return data;
    }

    function setAttributeChoiceListener() {
        var $attributeChoice = $('#attributeChoice');
        $attributeChoice.find('button').on('click', function (event) {
            event.preventDefault();

            var $attributeChoiceSelect = $attributeChoice.find('select');
            var data = '';
            var $newAttributes = $attributeChoiceSelect.val();

            if (null != $newAttributes) {
                $attributeChoiceSelect.val().forEach(function (item) {
                    if (!isInTheAttributesContainer(item)) {
                        data += $attributeChoiceSelect.prop('name') + '=' + item + "&";
                    }
                });
            }
            data += "count=" + getNextIndex();

            $.ajax({
                type: 'GET',
                url: $(this).parent().attr('data-action'),
                data: data,
                dataType: 'html',
                error: function () {
                    $('form').removeClass('loading');
                },
                success: function (data) {
                    var finalData = modifyAttributeForms($(data));

                    $(finalData).each(function () {
                        var localeCode = $(this).find('input[type="hidden"]').last().val();
                        $('#attributesContainer > div[data-tab="' + localeCode + '"]').append(this);
                    });

                    $('#sylius_product_attribute_choice').val('');

                    addAttributesNumber($.grep($(finalData), function (a) {
                        return $(a).hasClass('attribute');
                    }).length);
                    modifySelectorOnAttributesListElementDelete();

                    $('form').removeClass('loading');
                }
            });
        });
    }

    function isInTheAttributesContainer(attributeId) {
        var result = false;
        $('#attributesContainer .attribute').each(function () {
            var dataId = $(this).attr('data-id');
            if (dataId === attributeId) {
                result = true;
            }
        });

        return result;
    }
})(jQuery);

/*
 * This file is part of the Sylius package.
 *
 * (c) Paweł Jędrzejewski
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

(function ($) {
    'use strict';

    $.fn.extend({
        productAutoComplete: function () {
            $(this).each(function () {
                $(this).dropdown('set selected', $(this).find('input[name*="[associations]"]').val().split(','));
            });

            $(this).dropdown({
                delay: {
                    search: 250,
                },
                forceSelection: false,
                apiSettings: {
                    dataType: 'JSON',
                    cache: false,
                    data: {
                        criteria: {search: {type: 'contains', value: ''}}
                    },
                    beforeSend: function (settings) {
                        settings.data.criteria.search.value = settings.urlData.query;

                        return settings;
                    },
                    onResponse: function (response) {
                        var myResults = [];
                        $.each(response._embedded.items, function (index, item) {
                            myResults.push({
                                name: item.name,
                                value: item.code
                            });
                        });

                        return {
                            success: true,
                            results: myResults
                        };
                    }
                },
                onAdd: function (addedValue, addedText, $addedChoice) {
                    var inputAssociation = $addedChoice.parents('.product-select').find('input[name*="[associations]"]');
                    var associatedProductCodes = 0 < inputAssociation.val().length ? inputAssociation.val().split(',') : [];

                    associatedProductCodes.push(addedValue);
                    $.unique(associatedProductCodes.sort());

                    inputAssociation.attr('value', associatedProductCodes.join());
                },
                onRemove: function (removedValue, removedText, $removedChoice) {
                    var inputAssociation = $removedChoice.parents('.product-select').find('input[name*="[associations]"]');
                    var associatedProductCodes = 0 < inputAssociation.val().length ? inputAssociation.val().split(',') : [];

                    associatedProductCodes.splice($.inArray(removedValue, associatedProductCodes), 1);

                    inputAssociation.attr('value', associatedProductCodes.join());
                }
            });
        }
    });

})(jQuery);

(function ($) {
    'use strict';

    var methods = {
        init: function (options) {
            var settings = $.extend({
                'prototypePrefix': false,
                'containerSelector': false
            }, options);

            return this.each(function () {
                show($(this), false);
                $(this).change(function () {
                    show($(this), true);
                });

                function show(element, replace) {
                    var selectedValue = element.val();
                    var prototypePrefix = element.attr('id');
                    if (false != settings.prototypePrefix) {
                        prototypePrefix = settings.prototypePrefix;
                    }

                    var prototypeElement = $('#' + prototypePrefix + '_' + selectedValue);
                    var container;

                    if (settings.containerSelector) {
                        container = $(settings.containerSelector);
                    } else {
                        container = $(prototypeElement.data('container'));
                    }

                    if (!container.length) {
                        return;
                    }

                    if (!prototypeElement.length) {
                        container.empty();
                        return;
                    }

                    if (replace || !container.html().trim()) {
                        container.html(prototypeElement.data('prototype'));
                    }
                }
            });
        }
    };

    $.fn.handlePrototypes = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.handlePrototypes');
        }
    };
})(jQuery);

/*
 * This file is part of the Sylius package.
 *
 * (c) Paweł Jędrzejewski
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

(function ($) {
    'use strict';

    $.fn.extend({
        requireConfirmation: function () {
            return this.each(function () {
                return $(this).on('click', function (event) {
                    event.preventDefault();

                    var actionButton = $(this);

                    if (actionButton.is('a')) {
                        $('#confirmation-button').attr('href', actionButton.attr('href'));
                    }
                    if (actionButton.is('button')) {
                        $('#confirmation-button').on('click', function (event) {
                            event.preventDefault();

                            return actionButton.closest('form').submit();
                        });
                    }

                    return $('#confirmation-modal').modal('show');
                });
            });
        }
    });
})(jQuery);

/*
 * This file is part of the Sylius package.
 *
 * (c) Paweł Jędrzejewski
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

(function ($) {
    'use strict';

    $.fn.extend({
        toggleElement: function () {
            return this.each(function () {
                $(this).on('change', function (event) {
                    event.preventDefault();

                    var toggleElement = $(this);
                    var targetElement = $('#' + toggleElement.data('toggles'));

                    if (toggleElement.is(':checked')) {
                        targetElement.show();
                    } else {
                        targetElement.hide();
                    }
                });

                return $(this).trigger('change');
            });
        }
    });
})(jQuery);

/*
 * This file is part of the Sylius package.
 *
 * (c) Paweł Jędrzejewski
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */


(function ($) {
    $(document).ready(function () {
        $('.cart.button')
            .popup({
                popup: $('.cart.popup'),
                on: 'click',
            })
        ;

        $('.star.rating').rating({
            fireOnInit: true,
            onRate: function (value) {
                $("[name='sylius_product_review[rating]']:checked").removeAttr('checked');
                $("#sylius_product_review_rating_" + (value - 1)).attr('checked', 'checked');
            }
        });

        $('#sylius_checkout_address_customer_email').apiToggle({
            dataType: 'json',
            method: 'GET',
            throttle: 1500,

            beforeSend: function (settings) {
                var email = $('#sylius_checkout_address_customer_email').val();

                if (email.length < 3) {
                    return false;
                }

                settings.data = {
                    email: email
                };

                return settings;
            },

            successTest: function (response) {
                return $('#sylius_checkout_address_customer_email').val() === response.username;
            }
        }, $('#sylius-api-login-form'));

        $('#sylius-api-login').apiLogin({
            method: 'POST',
            throttle: 500
        });

        $('.sylius-cart-remove-button').removeFromCart();
        $('#sylius-product-adding-to-cart').addToCart();

        $('#sylius-shipping-address').addressBook();
        $('#sylius-billing-address').addressBook();
        $(document).provinceField();
        $(document).variantPrices();
        $(document).variantImages();
    });
})(jQuery);

/*
 * This file is part of the Sylius package.
 *
 * (c) Paweł Jędrzejewski
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

(function ($) {
    'use strict';

    $.fn.extend({
        addToCart: function () {
            var element = $(this);
            var href = $(element).attr('action');
            var redirectUrl = $(element).data('redirect');
            var validationElement = $('#sylius-cart-validation-error');

            $(element).api({
                method: 'POST',
                on: 'submit',
                cache: false,
                url: href,
                beforeSend: function (settings) {
                    settings.data = $(this).serialize();

                    return settings;
                },
                onSuccess: function (response) {
                    validationElement.addClass('hidden');
                    window.location.replace(redirectUrl);
                },
                onFailure: function (response) {
                    validationElement.removeClass('hidden');
                    var validationMessage = '';

                    $.each(response.errors.errors, function (key, message) {
                        validationMessage += message;
                    });
                    validationElement.html(validationMessage);
                    $(element).removeClass('loading');
                },
            });
        }
    });
})(jQuery);

/*
 * This file is part of the Sylius package.
 *
 * (c) Paweł Jędrzejewski
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

(function ($) {
    'use strict';

    $.fn.extend({
        addressBook: function () {
            var element = $(this);
            var select = element.find('.address-book-select');

            select.dropdown({
                forceSelection: false,

                onChange: function (name, text, choice) {
                    var provinceCode = choice.data()['provinceCode'];
                    var provinceName = choice.data()['provinceName'];

                    $.each(element.find('input'), function (key, input) {
                        $(input).val('');
                    });
                    $.each(element.find('select'), function (key, select) {
                        $(select).val('');
                    });

                    $.each(choice.data(), function (property, value) {
                        var field = findByName(property);

                        if (-1 !== property.indexOf('countryCode')) {
                            field.val(value).change();

                            var exists = setInterval(function () {
                                var provinceCodeField = findByName('provinceCode');
                                var provinceNameField = findByName('provinceName');

                                if (0 !== provinceCodeField.length && ('' !== provinceCode || undefined != provinceCode)) {
                                    provinceCodeField.val(provinceCode);

                                    clearInterval(exists);
                                } else if (0 !== provinceNameField.length && ('' !== provinceName || undefined != provinceName)) {
                                    provinceNameField.val(provinceName);

                                    clearInterval(exists);
                                }
                            }, 100);
                        } else {
                            field.val(value);
                        }
                    });
                }
            });

            var parseKey = function (key) {
                return key.replace(/(_\w)/g, function (words) {
                    return words[1].toUpperCase()
                });
            };
            var findByName = function (name) {
                return element.find('[name*=' + parseKey(name) + ']');
            };
        }
    });
})(jQuery);

/*
 * This file is part of the Sylius package.
 *
 * (c) Paweł Jędrzejewski
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

(function ($) {
    'use strict';

    $.fn.extend({
        provinceField: function () {
            var countrySelect = $('select[name$="[countryCode]"]');

            countrySelect.on('change', function (event) {
                var select = $(event.currentTarget);
                var provinceContainer = select.parents('.field').next('div.province-container');

                var provinceSelectFieldName = select.attr('name').replace('country', 'province');
                var provinceInputFieldName = select.attr('name').replace('countryCode', 'provinceName');

                if ('' === select.val() || undefined == select.val()) {
                    provinceContainer.fadeOut('slow', function () {
                        provinceContainer.html('');
                    });

                    return;
                }

                $.get(provinceContainer.attr('data-url'), {countryCode: $(this).val()}, function (response) {
                    if (!response.content) {
                        provinceContainer.fadeOut('slow', function () {
                            provinceContainer.html('');
                        });
                    } else if (-1 !== response.content.indexOf('select')) {
                        provinceContainer.fadeOut('slow', function () {

                            var provinceSelectValue = getProvinceInputValue(
                                $(provinceContainer).find('select > option[selected$="selected"]').val()
                            );

                            provinceContainer.html(response.content.replace(
                                'name="sylius_address_province"',
                                'name="' + provinceSelectFieldName + '"' + provinceSelectValue
                            )
                                .replace(
                                    'option value="" selected="selected"',
                                    'option value=""'
                                )
                                .replace(
                                    'option ' + provinceSelectValue,
                                    'option ' + provinceSelectValue + '" selected="selected"'
                                ));

                            provinceContainer.fadeIn();
                        });
                    } else {
                        provinceContainer.fadeOut('slow', function () {

                            var provinceInputValue = getProvinceInputValue($(provinceContainer).find('input').val());

                            provinceContainer.html(response.content.replace(
                                'name="sylius_address_province"',
                                'name="' + provinceInputFieldName + '"' + provinceInputValue
                            ));

                            provinceContainer.fadeIn();
                        });
                    }
                });
            });

            if ('' !== countrySelect.val()) {
                countrySelect.trigger('change');
            }

            if ('' === $.trim($('div.province-container').text())) {
                $('select.country-select').trigger('change');
            }

            var billingAddressCheckbox = $('input[type="checkbox"][name$="[differentBillingAddress]"]');
            var billingAddressContainer = $('#sylius-billing-address-container');
            var toggleBillingAddress = function () {
                billingAddressContainer.toggle(billingAddressCheckbox.prop('checked'));
            };
            toggleBillingAddress();
            billingAddressCheckbox.on('change', toggleBillingAddress);

            var getProvinceInputValue = function (valueSelector) {
                return undefined == valueSelector ? '' : 'value="' + valueSelector + '"';
            };
        }
    });
})(jQuery);

/*
 * This file is part of the Sylius package.
 *
 * (c) Paweł Jędrzejewski
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

(function ($) {
    'use strict';

    $.fn.extend({
        removeFromCart: function () {
            $.each($(this), function (index, element) {
                var redirectUrl = $(element).data('redirect');
                var csrfToken = $(element).data('csrf-token');

                $(element).api({
                    method: 'DELETE',
                    on: 'click',
                    beforeSend: function (settings) {
                        settings.data = {
                            _csrf_token: csrfToken
                        };

                        return settings;
                    },
                    onSuccess: function (response) {
                        window.location.replace(redirectUrl);
                    }
                });
            });
        }
    });

})(jQuery);

/*
 * This file is part of the Sylius package.
 *
 * (c) Paweł Jędrzejewski
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

(function ($) {
    'use strict';

    $.fn.extend({
        variantImages: function () {
            if ($('[data-variant-options]').length > 0) {
                handleProductOptionImages();
                handleProductOptionChange();
            } else if ($('[data-variant-code]').length > 0) {
                handleProductVariantImages($('[name="sylius_add_to_cart[cartItem][variant]"]'));
                handleProductVariantChange();
            }
        }
    });
})(jQuery);

function handleProductOptionChange() {
    $('[name*="sylius_add_to_cart[cartItem][variant]"]').on('change', function () {
        handleProductOptionImages();
    });
}

function handleProductVariantChange() {
    $('[name="sylius_add_to_cart[cartItem][variant]"]').on('change', function () {
        handleProductVariantImages($(this))
    });
}

function handleProductOptionImages() {
    var options = '';

    $('#sylius-product-adding-to-cart select').each(function () {
        options += $(this).find('option:selected').val() + ' ';
    });

    var imagesWithOptions = [];
    var optionsArray = options.trim().split(' ');

    $('[data-variant-options]').each(function () {
        var imageOptions = $(this).attr('data-variant-options');
        var imageHasOptions = optionsArray.every(function (option) {
            return imageOptions.indexOf(option) > -1;
        });

        if (imageHasOptions) {
            imagesWithOptions.push($(this).closest('div.ui.image'));
        }
    });

    changeMainImage(imagesWithOptions.shift());
}

function handleProductVariantImages(element) {
    var variantCode = $(element).attr('value');
    var imagesWithVariantCode = [];

    $('[data-variant-code*="' + variantCode + '"]').each(function () {
        imagesWithVariantCode.push($(this).closest('div.ui.image'));
    });

    changeMainImage(imagesWithVariantCode.shift());
}

function changeMainImage(newImageDiv) {
    var mainImageLink = $('a.ui.fluid.image');
    var mainImage = $('a.ui.fluid.image > img');

    var newImage = $(newImageDiv).find('img');
    var newImageLink = $(newImageDiv).find('a');

    if (newImage.length == 0 && newImageLink.length == 0) {
        mainImage.attr('src', $('div[data-product-image]').attr('data-product-image'));
        newImageLink.attr('href', $('div[data-product-link]').attr('data-product-link'));

        return;
    }

    mainImageLink.attr('href', newImageLink.attr('href'));
    mainImage.attr('src', newImage.attr('data-large-thumbnail'));
}

/*
 * This file is part of the Sylius package.
 *
 * (c) Paweł Jędrzejewski
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

(function ($) {
    'use strict';

    $.fn.extend({
        variantPrices: function () {
            if ($('#sylius-variants-pricing').length > 0) {
                handleProductOptionsChange();
            } else if ($("#sylius-product-variants").length > 0) {
                handleProductVariantsChange();
            }
        }
    });
})(jQuery);

function handleProductOptionsChange() {
    $('[name*="sylius_add_to_cart[cartItem][variant]"]').on('change', function () {
        var $selector = '';

        $('#sylius-product-adding-to-cart select').each(function () {
            var option = $(this).find('option:selected').val();
            $selector += '[data-' + $(this).attr('data-option') + '="' + option + '"]';
        });

        var $price = $('#sylius-variants-pricing').find($selector).attr('data-value');

        if ($price !== undefined) {
            $('#product-price').text($price);
            $('button[type=submit]').removeAttr('disabled');
        } else {
            $('#product-price').text($('#sylius-variants-pricing').attr('data-unavailable-text'));
            $('button[type=submit]').attr('disabled', 'disabled');
        }
    });
}

function handleProductVariantsChange() {
    $('[name="sylius_add_to_cart[cartItem][variant]"]').on('change', function () {
        var $price = $(this).parents('tr').find('.sylius-product-variant-price').text();
        $('#product-price').text($price);
    });
}