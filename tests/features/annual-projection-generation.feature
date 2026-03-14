@feature_id:e97090ac-8e4d-43a1-910a-03fd45603be0
@epic_id:0030b503-b5e4-40e8-b638-d949cf070623
Feature: Annual Projection Generation
  Generates annual projections for the next 10 years based on user inputs.

  @scenario_id:10400b88-646e-4d5f-ae4b-8a4c83670cb3
  @scenario_type:UI
  @ui_test
  Scenario: Projections are generated in less than 500ms after inputs are submitted
    # Scenario ID: 10400b88-646e-4d5f-ae4b-8a4c83670cb3
    # Feature ID: e97090ac-8e4d-43a1-910a-03fd45603be0
    # Scenario Type: UI
    # Description: Projections are generated in less than 500ms after inputs are submitted
    Given User navigates to the Annual Projection Generation feature
    When User inputs parameters for the annual projections
    Then Projections are generated within 500ms
    # Priority: medium
    # Status: draft
    # Test Runner Info: feature_id=e97090ac-8e4d-43a1-910a-03fd45603be0, scenario_id=10400b88-646e-4d5f-ae4b-8a4c83670cb3, type=UI

  @scenario_id:7993986e-79c3-4341-b36b-4a6cfd628176
  @scenario_type:UI
  @ui_test
  Scenario: Projections accurately reflect user-defined parameters
    # Scenario ID: 7993986e-79c3-4341-b36b-4a6cfd628176
    # Feature ID: e97090ac-8e4d-43a1-910a-03fd45603be0
    # Scenario Type: UI
    # Description: Projections accurately reflect user-defined parameters
    Given User navigates to the Annual Projection Generation feature
    When User inputs specific parameters for annual projections
    Then Projections are generated based on the user-defined parameters
    # Priority: medium
    # Status: draft
    # Test Runner Info: feature_id=e97090ac-8e4d-43a1-910a-03fd45603be0, scenario_id=7993986e-79c3-4341-b36b-4a6cfd628176, type=UI

  @scenario_id:2124c103-5564-4e8e-882e-e3b74acf5fd6
  @scenario_type:UI
  @ui_test
  Scenario: All projections are stored in the database
    # Scenario ID: 2124c103-5564-4e8e-882e-e3b74acf5fd6
    # Feature ID: e97090ac-8e4d-43a1-910a-03fd45603be0
    # Scenario Type: UI
    # Description: All projections are stored in the database
    Given User navigates to the Annual Projection Generation feature
    When User inputs parameters for the annual projections
    And User submits the inputs to generate projections
    Then Projections are successfully stored in the database
    # Priority: medium
    # Status: draft
    # Test Runner Info: feature_id=e97090ac-8e4d-43a1-910a-03fd45603be0, scenario_id=2124c103-5564-4e8e-882e-e3b74acf5fd6, type=UI
