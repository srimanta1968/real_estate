@feature_id:21ea1201-22c4-4553-9496-110d93996ad8
@epic_id:b44ac55e-3da7-410a-9d58-e3cd471d2640
Feature: Cash Flow Analysis
  Analyzes the cash flows for the investment based on input metrics.

  @scenario_id:dda474d1-d221-43b9-8624-4de4106c491a
  @scenario_type:UI
  @ui_test
  Scenario: Cash Flow analysis returns accurate results.
    # Scenario ID: dda474d1-d221-43b9-8624-4de4106c491a
    # Feature ID: 21ea1201-22c4-4553-9496-110d93996ad8
    # Scenario Type: UI
    # Description: Cash Flow analysis returns accurate results.
    Given User has valid input metrics for cash flow analysis
    When User submits the cash flow analysis request
    Then The system returns the cash flow analysis results
    And The results match the expected values based on the input metrics
    # Priority: medium
    # Status: draft
    # Test Runner Info: feature_id=21ea1201-22c4-4553-9496-110d93996ad8, scenario_id=dda474d1-d221-43b9-8624-4de4106c491a, type=UI

  @scenario_id:f8bf2af5-1542-4691-a274-f0231a78061a
  @scenario_type:UI
  @ui_test
  Scenario: Analysis is performed in under 500ms.
    # Scenario ID: f8bf2af5-1542-4691-a274-f0231a78061a
    # Feature ID: 21ea1201-22c4-4553-9496-110d93996ad8
    # Scenario Type: UI
    # Description: Analysis is performed in under 500ms.
    Given User has valid input metrics for cash flow analysis
    When User submits the cash flow analysis request
    Then The system processes the request
    And The analysis is completed within 500 milliseconds
    # Priority: medium
    # Status: draft
    # Test Runner Info: feature_id=21ea1201-22c4-4553-9496-110d93996ad8, scenario_id=f8bf2af5-1542-4691-a274-f0231a78061a, type=UI

  @scenario_id:ec3863d8-f22e-40ea-861a-df553ec32b4e
  @scenario_type:UI
  @ui_test
  Scenario: Results are displayed clearly on the user interface.
    # Scenario ID: ec3863d8-f22e-40ea-861a-df553ec32b4e
    # Feature ID: 21ea1201-22c4-4553-9496-110d93996ad8
    # Scenario Type: UI
    # Description: Results are displayed clearly on the user interface.
    Given User has valid input metrics for cash flow analysis
    When User submits the cash flow analysis request
    Then The system returns the cash flow analysis results
    And The results are presented in a clear and user-friendly manner on the interface
    # Priority: medium
    # Status: draft
    # Test Runner Info: feature_id=21ea1201-22c4-4553-9496-110d93996ad8, scenario_id=ec3863d8-f22e-40ea-861a-df553ec32b4e, type=UI
