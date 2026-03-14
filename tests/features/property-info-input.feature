@feature_id:da996b12-2e24-4ece-8564-1dd9c32d4dac
@epic_id:f4cc8370-9d3e-4217-bffe-f183e79fe35e
Feature: Property Info Input
  Allows users to input essential property information such as address and purchase price.

  @scenario_id:9b63c00c-3bcb-4688-9e41-2ab9611fda52
  @scenario_type:UI
  @ui_test
  Scenario: Users can input property address without errors.
    # Scenario ID: 9b63c00c-3bcb-4688-9e41-2ab9611fda52
    # Feature ID: da996b12-2e24-4ece-8564-1dd9c32d4dac
    # Scenario Type: UI
    # Description: Users can input property address without errors.
    Given The user is on the property information input page.
    When The user inputs a valid property address.
    Then The system accepts the property address without any errors.
    # Priority: medium
    # Status: draft
    # Test Runner Info: feature_id=da996b12-2e24-4ece-8564-1dd9c32d4dac, scenario_id=9b63c00c-3bcb-4688-9e41-2ab9611fda52, type=UI

  @scenario_id:e94388d0-3014-42a5-b4aa-4c4d0ed3e2a1
  @scenario_type:UI
  @ui_test
  Scenario: Users can input purchase price as a numeric value without errors.
    # Scenario ID: e94388d0-3014-42a5-b4aa-4c4d0ed3e2a1
    # Feature ID: da996b12-2e24-4ece-8564-1dd9c32d4dac
    # Scenario Type: UI
    # Description: Users can input purchase price as a numeric value without errors.
    Given The user is on the property information input page.
    When The user inputs a valid numeric purchase price.
    Then The system accepts the purchase price without any errors.
    # Priority: medium
    # Status: draft
    # Test Runner Info: feature_id=da996b12-2e24-4ece-8564-1dd9c32d4dac, scenario_id=e94388d0-3014-42a5-b4aa-4c4d0ed3e2a1, type=UI

  @scenario_id:ae691ccd-fa2b-43cd-9b9c-3b720abab041
  @scenario_type:UI
  @ui_test
  Scenario: The input form validates data in real-time.
    # Scenario ID: ae691ccd-fa2b-43cd-9b9c-3b720abab041
    # Feature ID: da996b12-2e24-4ece-8564-1dd9c32d4dac
    # Scenario Type: UI
    # Description: The input form validates data in real-time.
    Given The user is on the property information input page.
    When The user starts inputting data into the form.
    Then The form provides real-time validation feedback for the input data.
    # Priority: medium
    # Status: draft
    # Test Runner Info: feature_id=da996b12-2e24-4ece-8564-1dd9c32d4dac, scenario_id=ae691ccd-fa2b-43cd-9b9c-3b720abab041, type=UI
