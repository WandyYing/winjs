//-----------------------------------------------------------------------------
//
//  Copyright (c) Microsoft Corporation. All rights reserved.
//
//  Abstract:
//
//  Accessibility Tests for the tooltip.  Mainly check the ARIA tags.
//
//  Author: evanwi
//
//-----------------------------------------------------------------------------
/// <reference path="ms-appx://$(TargetFramework)/js/base.js" />
/// <reference path="ms-appx://$(TargetFramework)/js/en-us/base.strings.js" />
/// <reference path="ms-appx://$(TargetFramework)/js/ui.js" />
/// <reference path="ms-appx://$(TargetFramework)/js/en-us/ui.strings.js" />
/// <reference path="ms-appx://$(TargetFramework)/css/ui-dark.css" />
/// <reference path="..\TestLib\LegacyLiveUnit\commonutils.js"/>
/// <reference path="tooltiputils.js"/>
/// <reference path="tooltip.css"/>

TooltipAccessibilityTests = function () {
    var tooltipUtils = new TooltipUtils();
    var commonUtils = new CommonUtils();

    this.setUp = function () {
        tooltipUtils.setUp();
    };

    this.tearDown = function () {
        tooltipUtils.cleanUp();
    };

    //-----------------------------------------------------------------------------------

    this.testTooltip_VerifyARIA = function (signalTestCaseCompleted) {
        LiveUnit.LoggingCore.logComment("Window size: " + window.innerWidth + " " + window.innerHeight);

        // Set up the anchor/trigger element.
        var element = document.getElementById(tooltipUtils.defaultElementID);
        tooltipUtils.positionElement(element, "center");

        // set up the tooltip
        var tooltip = tooltipUtils.instantiate(tooltipUtils.defaultElementID, { innerHTML: "tooltip", placement: "top" });

        function tooltipEventListener(event) {
            LiveUnit.Assert.isNotNull(event);
            LiveUnit.LoggingCore.logComment(event.type);
            tooltipUtils.logTooltipInformation(tooltip);

            LiveUnit.LoggingCore.logComment("element aria-describedby: " + tooltip._anchorElement.getAttribute("aria-describedby"));
            if (tooltip._domElement) {
                LiveUnit.LoggingCore.logComment("tooltip id: " + tooltip._domElement.getAttribute("id"));
                LiveUnit.LoggingCore.logComment("tooltip role: " + tooltip._domElement.getAttribute("role"));
            }

            switch (event.type) {
                case "trigger":
                    tooltipUtils.displayTooltip("mouse", element);
                    break;
                case "beforeopen":
                    LiveUnit.Assert.isNull(tooltip._anchorElement.getAttribute("aria-describedby"));

                    // The tooltip DOM isn't created until after "beforeopen" returns so  
                    // lets immediately fire another event and check the tooltip's DOM  
                    // then.  We have to add the tooltipEventListener as a property  
                    // of a global object (let's try window), otherwise it's not available to setTimeout().  
                    window.tooltipEventListener = tooltipEventListener;
                    setTimeout("window.tooltipEventListener({type:'beforeopen+1'});");
                    break;
                case "beforeopen+1":
                    LiveUnit.Assert.isNotNull(tooltip._anchorElement.getAttribute("aria-describedby"));
                    break;
                case "opened":
                    LiveUnit.Assert.areEqual(tooltip._domElement.getAttribute("role"), "tooltip");
                    LiveUnit.Assert.areEqual(tooltip._anchorElement.getAttribute("aria-describedby"),
                                             tooltip._domElement.getAttribute("id"));

                    // If we have an aria-hidden attribute, make sure it says we're visible
                    var hidden = tooltip._domElement.getAttribute("aria-hidden");
                    if (hidden) {
                        LiveUnit.Assert.areEqual(hidden, "false");
                    }

                    // Make sure we can't tab to the tooltip
                    var tabindex = tooltip._domElement.getAttribute("tabindex");
                    LiveUnit.LoggingCore.logComment("tooltip tabindex: " + tabindex);
                    LiveUnit.Assert.isTrue(parseInt(tabindex) < 0);

                    // fire mouse out which should dismiss the tooltip.
                    commonUtils.mouseOverUsingMiP(element, null);
                    break;
                case "beforeclose":
                    LiveUnit.Assert.areEqual(tooltip._domElement.getAttribute("role"), "tooltip");
                    LiveUnit.Assert.areEqual(tooltip._anchorElement.getAttribute("aria-describedby"),
                                             tooltip._domElement.getAttribute("id"));

                    // If we have an aria-hidden attribute, make sure it says we're visible
                    var hidden = tooltip._domElement.getAttribute("aria-hidden");
                    if (hidden) {
                        LiveUnit.Assert.areEqual(hidden, "false");
                    }
                    // The tooltip DOM is gone in the "closed" event, so just test it right after beforeclose.
                    window.tooltipEventListener = tooltipEventListener;
                    setTimeout("window.tooltipEventListener({type:'beforeclose+1'});");
                    break;
                case "beforeclose+1":
                    LiveUnit.Assert.isNotNull(tooltip._anchorElement.getAttribute("aria-describedby"));
                    break;
                case "closed":
                    LiveUnit.Assert.isNull(tooltip._anchorElement.getAttribute("aria-describedby"));
                    window.tooltipEventListener = null;
                    tooltipUtils.fireSignalTestCaseCompleted(signalTestCaseCompleted);
                    break;
            }
        }
        tooltipUtils.setupTooltipListener(tooltip, tooltipEventListener);
        tooltipUtils.addSignalTestCaseCompleted(tooltip, signalTestCaseCompleted, tooltipUtils);
    };

    this.testTooltip_VerifyARIA["Owner"] = "evanwi";
    this.testTooltip_VerifyARIA["Priority"] = "feature";
    this.testTooltip_VerifyARIA["Description"] = "Test Accessibility of the tooltip";
    this.testTooltip_VerifyARIA["Category"] = "Accessibility";
    this.testTooltip_VerifyARIA["LiveUnit.IsAsync"] = true;
};

// Register the object as a test class by passing in the name
LiveUnit.registerTestClass("TooltipAccessibilityTests");
