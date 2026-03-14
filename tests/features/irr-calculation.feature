@feature_id:2126d2da-ecc6-4e71-850c-5f894d14fe90
@epic_id:b44ac55e-3da7-410a-9d58-e3cd471d2640
Feature: IRR Calculation
  Calculates the Internal Rate of Return for the property investment.

  @scenario_id:291716bb-20ed-4c8c-8674-6b98c84d74af
  @scenario_type:UI
  @ui_test
  Scenario: IRR calculation returns accurate results
    # Scenario ID: 291716bb-20ed-4c8c-8674-6b98c84d74af
    # Feature ID: 2126d2da-ecc6-4e71-850c-5f894d14fe90
    # Scenario Type: UI
    # Description: IRR calculation returns accurate results.
    Given the user inputs the cash flow data for the property investment
    When the user initiates the IRR calculation
    Then the system calculates the IRR based on the provided cash flow data
    And the calculated IRR is accurate within an acceptable range
    # Priority: medium
    # Status: draft
    # Test Runner Info: feature_id=2126d2da-ecc6-4e71-850c-5f894d14fe90, scenario_id=291716bb-20ed-4c8c-8674-6b98c84d74af, type=UI

  @scenario_id:c0a9ba35-0a0d-42ea-ad42-9a0e91d3281b
  @scenario_type:UI
  @ui_test
  Scenario: Calculation is performed in under 500ms
    # Scenario ID: c0a9ba35-0a0d-42ea-ad42-9a0e91d3281b
    # Feature ID: 2126d2da-ecc6-4e71-850c-5f894d14fe90
    # Scenario Type: UI
    # Description: Calculation is performed in under 500ms.
    Given the user inputs the cash flow data for the property investment
    When the user initiates the IRR calculation
    Then the system completes the IRR calculation
    And the total time taken for the calculation is less than 500ms
    # Priority: medium
    # Status: draft
    # Test Runner Info: feature_id=2126d2da-ecc6-4e71-850c-5f894d14fe90, scenario_id=c0a9ba35-0a0d-42ea-ad42-9a0e91d3281b, type=UI

  @scenario_id:4053664b-f809-46ad-ad11-fd05ae3ce0c7
  @scenario_type:UI
  @ui_test
  Scenario: Results are displayed clearly on the user interface
    # Scenario ID: 4053664b-f809-46ad-ad11-fd05ae3ce0c7
    # Feature ID: 2126d2da-ecc6-4e71-850c-5f894d14fe90
    # Scenario Type: UI
    # Description: Results are displayed clearly on the user interface.
    Given the user inputs the cash flow data for the property investment
    When the user initiates the IRR calculation
    Then the system displays the calculated IRR on the user interface
    And the displayed results are clear and easy to read
    # Priority: medium
    # Status: draft
    # Test Runner Info: feature_id=2126d2da-ecc6-4e71-850c-5f894d14fe90, scenario_id=4053664b-f809-46ad-ad11-fd05ae3ce0c7, type=UI
