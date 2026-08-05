import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import type { SelectChangeEvent } from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import "../styles/pages/CreateRule.css";
import "../styles/components/IP2Zone.css";
import "../styles/components/LogProfileStartEnd.css";
import IP2Zone from "../components/IP2Zone";
import MultipleSelectCheckmarks from "../components/MultipleSelectCheckmarks";
import SingleSelectTag from "../components/SingleSelectCheckmarks";
import type { TagOption } from "../components/SingleSelectCheckmarks";
import LogProfileStartEnd from "../components/LogProfileStartEnd";
import {
  getAllPanoramaTags,
  getAllPanoramaLogForwardingProfiles,
  getAllPanoramaSecurityProfileGroups,
  getAllPanoramaServices,
  getAllPanoramaApplications,
} from "../services/PanoramaCreateRule";
import type {
  PanoramaTagEntry,
  PanoramaLogForwardingProfileEntry,
  PanoramaSecurityProfileGroupEntry,
  PanoramaServiceEntry,
  PanoramaApplicationEntry,
} from "../services/PanoramaCreateRule";
import TicketNumber from "../components/TicketNumber";
import { PanoramaPreRuleFieldsAction } from "../features/IPanoramaPreRuleFields.feature.ts";
import { useAppDispatch, useAppSelector } from "../hook";
import { createPanoramaPreRule } from "../services/PanoramaCreateRule";
import { isPanoramaPreRuleValid } from "../components/Validation";

export default function CreateARule() {
  // Redux Variables
  const dispatch = useAppDispatch();
  const panorama = useAppSelector((state) => state.PanoramaPreRuleFields.TrackerPanorama);
  const isSubmitEnabled = isPanoramaPreRuleValid(panorama);

  // Rule Name and Description States
  const [ruleNameMode, setRuleNameMode] = useState<"automatic" | "manual">("automatic");
  const [descriptionMode, setDescriptionMode] = useState<"automatic" | "manual">("automatic");

  const isRuleNameReady = Boolean(
    panorama.From &&
      panorama.SourceName &&
      panorama.DestinationName &&
      panorama.TicketNumber
  );

  const isDescriptionReady = Boolean(
    panorama.TicketNumber &&
      panorama.Requester &&
      panorama.SourceName &&
      panorama.DestinationName &&
      panorama.Application &&
      panorama.Service
  );

  const ruleNameDisplayValue =
    ruleNameMode === "automatic" && !isRuleNameReady ? "" : panorama.RuleName;

  const descriptionDisplayValue =
    descriptionMode === "automatic" && !isDescriptionReady ? "" : panorama.Description;

  // Form States
  const [deviceGroups, setDeviceGroups] = useState<string[]>([]);

  const [tags, setTags] = useState<PanoramaTagEntry[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);

  const [applications, setApplications] = useState<PanoramaApplicationEntry[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);

  const [services, setServices] = useState<PanoramaServiceEntry[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  const [logForwardingProfilesData, setLogForwardingProfilesData] = useState<
    PanoramaLogForwardingProfileEntry[]
  >([]);
  const [logForwardingProfilesLoading, setLogForwardingProfilesLoading] = useState(false);

  const [securityProfileGroups, setSecurityProfileGroups] = useState<
    PanoramaSecurityProfileGroupEntry[]
  >([]);
  const [securityProfileGroupsLoading, setSecurityProfileGroupsLoading] = useState(false);

  const selectedLogPositions = [
    ...(panorama.LogStart === "yes" ? ["start"] : []),
    ...(panorama.LogEnd === "yes" ? ["end"] : []),
  ];

  // IP2Zone Fields
  const emptyChartDetails = {
    firewallHostname: "",
    firewallSerialNumber: "",
    zone: "",
    firewallGroup: "",
  };

  const [sourceDetails, setSourceDetails] = useState(emptyChartDetails);
  const [destDetails, setDestDetails] = useState(emptyChartDetails);

  const resetLookupDependentState = () => {
    setSourceDetails(emptyChartDetails);
    setDestDetails(emptyChartDetails);
    setDeviceGroups([]);
    setTags([]);
    setApplications([]);
    setServices([]);
    setLogForwardingProfilesData([]);
    setSecurityProfileGroups([]);

    dispatch(
      PanoramaPreRuleFieldsAction.SetPanoramaPreRuleField({
        field: "DeviceGroup",
        value: "",
      })
    );
  };

  const handleSourceIpChange = (value: string) => {
    resetLookupDependentState();
    dispatch(PanoramaPreRuleFieldsAction.SetPanoramaPreRuleField({ field: "Source", value }));
  };

  const handleDestIpChange = (value: string) => {
    resetLookupDependentState();
    dispatch(PanoramaPreRuleFieldsAction.SetPanoramaPreRuleField({ field: "Destination", value }));
  };

  const handleDeviceGroupChange = async (event: SelectChangeEvent) => {
    const nextDeviceGroup = event.target.value;

    dispatch(
      PanoramaPreRuleFieldsAction.SetPanoramaPreRuleField({
        field: "DeviceGroup",
        value: nextDeviceGroup,
      })
    );

    setTags([]);
    setApplications([]);
    setServices([]);
    setLogForwardingProfilesData([]);
    setSecurityProfileGroups([]);

    if (!nextDeviceGroup || nextDeviceGroup === "Not Applicable") {
      return;
    }

    setTagsLoading(true);
    setApplicationsLoading(true);
    setServicesLoading(true);
    setLogForwardingProfilesLoading(true);
    setSecurityProfileGroupsLoading(true);

    try {
      const retrievedTags = await getAllPanoramaTags(nextDeviceGroup);
      setTags(retrievedTags);

      const retrievedApplications = await getAllPanoramaApplications(nextDeviceGroup);
      setApplications(retrievedApplications);

      const retrievedServices = await getAllPanoramaServices(nextDeviceGroup);
      setServices(retrievedServices);

      const retrievedLogForwardingProfiles =
        await getAllPanoramaLogForwardingProfiles(nextDeviceGroup);
      setLogForwardingProfilesData(retrievedLogForwardingProfiles);

      const retrievedSecurityProfileGroups =
        await getAllPanoramaSecurityProfileGroups();
      setSecurityProfileGroups(retrievedSecurityProfileGroups);
    } catch (error) {
      console.error("Failed to load tags:", error);
      setTags([]);
      setApplications([]);
      setServices([]);
      setLogForwardingProfilesData([]);
      setSecurityProfileGroups([]);
    } finally {
      setTagsLoading(false);
      setApplicationsLoading(false);
      setServicesLoading(false);
      setLogForwardingProfilesLoading(false);
      setSecurityProfileGroupsLoading(false);
    }
  };

  const handleLookupComplete = async (groups: string[]) => {
    if (groups.length === 0) {
      setDeviceGroups([]);
      setTags([]);
      setApplications([]);
      setServices([]);
      setLogForwardingProfilesData([]);
      setSecurityProfileGroups([]);

      dispatch(
        PanoramaPreRuleFieldsAction.SetPanoramaPreRuleField({
          field: "DeviceGroup",
          value: "",
        })
      );

      return;
    }

    setDeviceGroups(groups);
    setTags([]);
    setApplications([]);
    setServices([]);
    setLogForwardingProfilesData([]);
    setSecurityProfileGroups([]);

    if (groups.length === 1) {
      const autoSelectedGroup = groups[0];

      dispatch(
        PanoramaPreRuleFieldsAction.SetPanoramaPreRuleField({
          field: "DeviceGroup",
          value: autoSelectedGroup,
        })
      );

      setTagsLoading(true);
      setApplicationsLoading(true);
      setServicesLoading(true);
      setLogForwardingProfilesLoading(true);
      setSecurityProfileGroupsLoading(true);

      try {
        const retrievedTags = await getAllPanoramaTags(autoSelectedGroup);
        setTags(retrievedTags);

        const retrievedApplications =
          await getAllPanoramaApplications(autoSelectedGroup);
        setApplications(retrievedApplications);

        const retrievedServices = await getAllPanoramaServices(autoSelectedGroup);
        setServices(retrievedServices);

        const retrievedLogForwardingProfiles =
          await getAllPanoramaLogForwardingProfiles(autoSelectedGroup);
        setLogForwardingProfilesData(retrievedLogForwardingProfiles);

        const retrievedSecurityProfileGroups =
          await getAllPanoramaSecurityProfileGroups();
        setSecurityProfileGroups(retrievedSecurityProfileGroups);
      } catch (error) {
        console.error("Failed to load tags:", error);
        setTags([]);
        setApplications([]);
        setServices([]);
        setLogForwardingProfilesData([]);
        setSecurityProfileGroups([]);
      } finally {
        setTagsLoading(false);
        setApplicationsLoading(false);
        setServicesLoading(false);
        setLogForwardingProfilesLoading(false);
        setSecurityProfileGroupsLoading(false);
      }
    } else {
      dispatch(
        PanoramaPreRuleFieldsAction.SetPanoramaPreRuleField({
          field: "DeviceGroup",
          value: "",
        })
      );
    }
  };

  // Same-zone override: runs only after both resolved zones are actually in state
  useEffect(() => {
    const sourceZone = sourceDetails.zone;
    const destZone = destDetails.zone;

    if (!sourceZone || !destZone) {
      return;
    }

    if (sourceZone === destZone) {
      setDeviceGroups(["Not Applicable"]);
      setTags([]);
      setApplications([]);
      setServices([]);
      setLogForwardingProfilesData([]);
      setSecurityProfileGroups([]);

      if (panorama.DeviceGroup !== "Not Applicable") {
        dispatch(
          PanoramaPreRuleFieldsAction.SetPanoramaPreRuleField({
            field: "DeviceGroup",
            value: "Not Applicable",
          })
        );
      }
    }
  }, [sourceDetails.zone, destDetails.zone, panorama.DeviceGroup, dispatch]);

  // Select options
  const applicationOptions: TagOption[] = applications.map((application) => ({
    name: application.name,
    location: application.location,
    deviceGroup: application.deviceGroup,
  }));

  const serviceOptions: TagOption[] = services.map((service) => ({
    name: service.name,
    location: service.location,
    deviceGroup: service.deviceGroup,
  }));

  const logForwardingProfiles: TagOption[] = logForwardingProfilesData.map((profile) => ({
    name: profile.name,
    location: profile.location,
    deviceGroup: profile.deviceGroup,
  }));

  const selectedLogProfile =
    logForwardingProfiles.find((profile) => profile.name === panorama.LogSetting) ?? null;

  const profileSettingOptions: TagOption[] = securityProfileGroups.map((profileGroup) => ({
    name: profileGroup.name,
    location: profileGroup.location,
  }));

  // MultipleSelectCheckmarks Components
  const selectedApplicationOptions: TagOption[] = applicationOptions.filter((app) =>
    panorama.Application
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
      .includes(app.name)
  );

  const selectedServiceOptions: TagOption[] = serviceOptions.filter((service) =>
    panorama.Service
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
      .includes(service.name)
  );

  const selectedTagOptions: TagOption[] = tags.filter((tag) =>
    panorama.Tag
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
      .includes(tag.name)
  );

  // SingleSelectCheckmark Components
  const selectedProfileSetting =
    profileSettingOptions.find((profile) => profile.name === panorama.ProfileSetting) ?? null;
  const selectedGroupTag = tags.find((tag) => tag.name === panorama.GroupTag) ?? null;

  // Automatically Generated Fields
  const generatedRuleName = [
    panorama.From,
    panorama.SourceName,
    "to",
    panorama.DestinationName,
    panorama.TicketNumber,
  ]
    .filter(Boolean)
    .join("-");

  const generatedDescription = [
    "Ticket:",
    panorama.TicketNumber,
    "| Requestor:",
    panorama.Requester,
    "| Purpose: To allow",
    panorama.SourceName,
    "to connect to",
    panorama.DestinationName,
    "using",
    panorama.Application,
    "on",
    panorama.Service,
  ]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    if (ruleNameMode !== "automatic") return;

    if (!isRuleNameReady) {
      if (panorama.RuleName !== "") {
        dispatch(
          PanoramaPreRuleFieldsAction.SetPanoramaPreRuleField({
            field: "RuleName",
            value: "",
          })
        );
      }
      return;
    }

    if (panorama.RuleName !== generatedRuleName) {
      dispatch(
        PanoramaPreRuleFieldsAction.SetPanoramaPreRuleField({
          field: "RuleName",
          value: generatedRuleName,
        })
      );
    }
  }, [ruleNameMode, isRuleNameReady, generatedRuleName, panorama.RuleName, dispatch]);

  useEffect(() => {
    if (descriptionMode !== "automatic") return;

    if (!isDescriptionReady) {
      if (panorama.Description !== "") {
        dispatch(
          PanoramaPreRuleFieldsAction.SetPanoramaPreRuleField({
            field: "Description",
            value: "",
          })
        );
      }
      return;
    }

    if (panorama.Description !== generatedDescription) {
      dispatch(
        PanoramaPreRuleFieldsAction.SetPanoramaPreRuleField({
          field: "Description",
          value: generatedDescription,
        })
      );
    }
  }, [descriptionMode, isDescriptionReady, generatedDescription, panorama.Description, dispatch]);

  // Submit payload
  const createPreRulePayload = {
    ruleName: panorama.RuleName,
    description: panorama.Description,
    deviceGroup: panorama.DeviceGroup,
    from: panorama.From,
    to: panorama.To,
    source: panorama.Source,
    destination: panorama.Destination,
    application: panorama.Application.split(",").map((v) => v.trim()).filter(Boolean),
    service: panorama.Service.split(",").map((v) => v.trim()).filter(Boolean),
    tag: panorama.Tag.split(",").map((v) => v.trim()).filter(Boolean),
    groupTag: panorama.GroupTag,
    action: panorama.Action,
    logSetting: panorama.LogSetting,
    logStart: panorama.LogStart,
    logEnd: panorama.LogEnd,
    profileSetting: panorama.ProfileSetting,
    requester: panorama.Requester,
    ticketNumber: panorama.TicketNumber,
    sourceName: panorama.SourceName,
    destinationName: panorama.DestinationName,
  };

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const handleSubmitPreRule = async () => {
    console.log("PANORAMA BEFORE SUBMIT", panorama);
    console.log("PAYLOAD BEFORE SUBMIT", createPreRulePayload);
    setSubmitLoading(true);
    setSubmitMessage("");

    try {
      const result = await createPanoramaPreRule(createPreRulePayload);
      setSubmitMessage(result.message || "Pre-rule submitted successfully.");
      console.log("Create pre-rule response:", result);
    } catch (error) {
      setSubmitMessage(error instanceof Error ? error.message : "Failed to submit pre-rule.");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="create-rule">
      <header className="panorama-hero">
        <p className="panorama-hero__eyebrow">Firewall Policy</p>
        <h1 className="panorama-hero__title">Create Firewall Pre-Rule</h1>
        <p className="panorama-hero__subtitle">
          Build a new Panorama pre-rule using automatic IP-to-zone discovery.
        </p>
      </header>

      <div className="create-rule__body">
        <TicketNumber
          value={panorama.TicketNumber}
          onChange={(value) =>
            dispatch(
              PanoramaPreRuleFieldsAction.SetPanoramaPreRuleFields({
                ...panorama,
                TicketNumber: value,
              })
            )
          }
        />

        <div className="create-rule__section">
          <div className="create-rule__section-header">
            <p className="IPSubtitle">Requester</p>
          </div>

          <Box className="create-rule__input-wrap">
            <TextField
              fullWidth
              value={panorama.Requester}
              onChange={(e) =>
                dispatch(
                  PanoramaPreRuleFieldsAction.SetPanoramaPreRuleField({
                    field: "Requester",
                    value: e.target.value,
                  })
                )
              }
              className="create-rule__input"
              label="Enter Requester Name"
              variant="outlined"
            />
          </Box>
        </div>

        <div className="create-rule__section">
          <div className="create-rule__section-header">
            <p className="IPSubtitle">Rule Name</p>
            <FormControlLabel
              className="create-rule__mode-toggle"
              control={
                <Switch
                  className="create-rule__mode-switch"
                  checked={ruleNameMode === "manual"}
                  onChange={(e) => setRuleNameMode(e.target.checked ? "manual" : "automatic")}
                />
              }
              label={ruleNameMode === "manual" ? "Manual" : "Automatic"}
            />
          </div>

          <Box className="create-rule__input-wrap">
            <TextField
              fullWidth
              value={ruleNameDisplayValue}
              onChange={(e) =>
                dispatch(
                  PanoramaPreRuleFieldsAction.SetPanoramaPreRuleField({
                    field: "RuleName",
                    value: e.target.value.replace(/\s+/g, ""),
                  })
                )
              }
              className="create-rule__input"
              label={ruleNameMode === "automatic" && !isRuleNameReady ? "Generating..." : "Enter Rule Name"}
              variant="outlined"
              disabled={ruleNameMode === "automatic"}
            />
          </Box>
        </div>

        <div className="create-rule__section">
          <div className="create-rule__section-header">
            <p className="IPSubtitle">Description</p>
            <FormControlLabel
              className="create-rule__mode-toggle"
              control={
                <Switch
                  className="create-rule__mode-switch"
                  checked={descriptionMode === "manual"}
                  onChange={(e) => setDescriptionMode(e.target.checked ? "manual" : "automatic")}
                />
              }
              label={descriptionMode === "manual" ? "Manual" : "Automatic"}
            />
          </div>

          <Box className="create-rule__input-wrap">
            <TextField
              fullWidth
              multiline
              minRows={3}
              value={descriptionDisplayValue}
              onChange={(e) =>
                dispatch(
                  PanoramaPreRuleFieldsAction.SetPanoramaPreRuleField({
                    field: "Description",
                    value: e.target.value,
                  })
                )
              }
              className="create-rule__input"
              label={
                descriptionMode === "automatic" && !isDescriptionReady
                  ? "Generating..."
                  : "Enter Description"
              }
              variant="outlined"
              disabled={descriptionMode === "automatic"}
            />
          </Box>
        </div>

        <div className="IP2ZoneWrapper">
          <IP2Zone
            sourceIp={panorama.Source}
            onSourceIpChange={handleSourceIpChange}
            sourceIpName={panorama.SourceName}
            onSourceIpNameChange={(value) =>
              dispatch(
                PanoramaPreRuleFieldsAction.SetPanoramaPreRuleField({
                  field: "SourceName",
                  value,
                })
              )
            }
            sourceDetails={sourceDetails}
            onSourceDetailsChange={(value) => {
              console.log("SOURCE DETAILS", value);
              setSourceDetails(value);
              dispatch(
                PanoramaPreRuleFieldsAction.SetPanoramaPreRuleField({
                  field: "From",
                  value: value.zone,
                })
              );
            }}
            destIp={panorama.Destination}
            onDestIpChange={handleDestIpChange}
            destIpName={panorama.DestinationName}
            onDestIpNameChange={(value) =>
              dispatch(
                PanoramaPreRuleFieldsAction.SetPanoramaPreRuleField({
                  field: "DestinationName",
                  value,
                })
              )
            }
            destDetails={destDetails}
            onDestDetailsChange={(value) => {
              console.log("DEST DETAILS", value);
              setDestDetails(value);
              dispatch(
                PanoramaPreRuleFieldsAction.SetPanoramaPreRuleField({
                  field: "To",
                  value: value.zone,
                })
              );
            }}
            onLookupComplete={handleLookupComplete}
          />
        </div>

        <div className="create-rule__section">
          <div className="create-rule__section-header">
            <p className="IPSubtitle">Device Group</p>
          </div>

          <Box className="create-rule__input-wrap">
            <div className="create-rule__input">
              <FormControl fullWidth disabled={deviceGroups.length === 0}>
                <InputLabel id="device-group-select-label">Select Device Group</InputLabel>
                <Select
                  labelId="device-group-select-label"
                  id="device-group-select"
                  value={panorama.DeviceGroup}
                  label="Select Device Group"
                  onChange={handleDeviceGroupChange}
                >
                  {deviceGroups.map((group) => (
                    <MenuItem key={group} value={group}>
                      {group}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
          </Box>
        </div>

        <div className="create-rule__section">
          <div className="create-rule__section-header">
            <p className="IPSubtitle">Application</p>
          </div>

          <Box className="create-rule__input-wrap create-rule__multi-select">
            <MultipleSelectCheckmarks
              options={applicationOptions}
              value={selectedApplicationOptions}
              onChange={(value) =>
                dispatch(
                  PanoramaPreRuleFieldsAction.SetPanoramaPreRuleFields({
                    ...panorama,
                    Application: value.map((v) => v.name).join(", "),
                  })
                )
              }
              disabled={
                !panorama.DeviceGroup ||
                panorama.DeviceGroup === "Not Applicable" ||
                applicationsLoading
              }
              label="Select Applications"
            />
          </Box>
        </div>

        <div className="create-rule__section">
          <div className="create-rule__section-header">
            <p className="IPSubtitle">Service</p>
          </div>

          <Box className="create-rule__input-wrap create-rule__multi-select">
            <MultipleSelectCheckmarks
              options={serviceOptions}
              value={selectedServiceOptions}
              onChange={(value) =>
                dispatch(
                  PanoramaPreRuleFieldsAction.SetPanoramaPreRuleFields({
                    ...panorama,
                    Service: value.map((v) => v.name).join(", "),
                  })
                )
              }
              disabled={
                !panorama.DeviceGroup ||
                panorama.DeviceGroup === "Not Applicable" ||
                servicesLoading
              }
              label="Select Services"
            />
          </Box>
        </div>

        <div className="create-rule__section">
          <div className="create-rule__section-header">
            <p className="IPSubtitle">Tags</p>
          </div>

          <Box className="create-rule__input-wrap create-rule__multi-select">
            <MultipleSelectCheckmarks
              options={tags}
              value={selectedTagOptions}
              onChange={(value) =>
                dispatch(
                  PanoramaPreRuleFieldsAction.SetPanoramaPreRuleFields({
                    ...panorama,
                    Tag: value.map((v) => v.name).join(", "),
                  })
                )
              }
              disabled={
                !panorama.DeviceGroup ||
                panorama.DeviceGroup === "Not Applicable" ||
                tagsLoading
              }
            />
          </Box>
        </div>

        <div className="create-rule__section">
          <div className="create-rule__section-header">
            <p className="IPSubtitle">Group Tag</p>
          </div>

          <Box className="create-rule__input-wrap create-rule__multi-select">
            <SingleSelectTag
              options={tags}
              disabled={
                !panorama.DeviceGroup ||
                panorama.DeviceGroup === "Not Applicable" ||
                tagsLoading
              }
              value={selectedGroupTag}
              onChange={(value) =>
                dispatch(
                  PanoramaPreRuleFieldsAction.SetPanoramaPreRuleFields({
                    ...panorama,
                    GroupTag: value?.name ?? "",
                  })
                )
              }
            />
          </Box>
        </div>

        <div className="create-rule__section">
          <Box className="create-rule__input-wrap create-rule__log-profile-start-end">
            <LogProfileStartEnd
              tagOptions={logForwardingProfiles}
              selectedTag={selectedLogProfile}
              onTagChange={(value) =>
                dispatch(
                  PanoramaPreRuleFieldsAction.SetPanoramaPreRuleFields({
                    ...panorama,
                    LogSetting: value?.name ?? "",
                  })
                )
              }
              selectedPositions={selectedLogPositions}
              onPositionChange={() => {}}
              onLogPositionChange={(value) =>
                dispatch(
                  PanoramaPreRuleFieldsAction.SetPanoramaPreRuleFields({
                    ...panorama,
                    LogStart: value.logStart,
                    LogEnd: value.logEnd,
                  })
                )
              }
              tagDisabled={
                !panorama.DeviceGroup ||
                panorama.DeviceGroup === "Not Applicable" ||
                logForwardingProfilesLoading
              }
              searchLabel="Enter Log Forwarding Profile"
              searchPlaceholder="Search log forwarding profiles..."
              helperText="Log Forwarding Profiles"
            />
          </Box>
        </div>

        <div className="create-rule__section">
          <div className="create-rule__section-header">
            <p className="IPSubtitle">Profile Setting</p>
          </div>

          <Box className="create-rule__input-wrap create-rule__multi-select">
            <SingleSelectTag
              options={profileSettingOptions}
              value={selectedProfileSetting}
              onChange={(value) =>
                dispatch(
                  PanoramaPreRuleFieldsAction.SetPanoramaPreRuleFields({
                    ...panorama,
                    ProfileSetting: value?.name ?? "",
                  })
                )
              }
              disabled={
                !panorama.DeviceGroup ||
                panorama.DeviceGroup === "Not Applicable" ||
                securityProfileGroupsLoading
              }
              label="Enter Security Profile Group"
            />
          </Box>
        </div>

        <div className="create-rule__section">
          <div className="create-rule__section-header">
            <p className="IPSubtitle">Action</p>
          </div>

          <Box className="create-rule__input-wrap">
            <div className="create-rule__input">
              <FormControl
                fullWidth
                disabled={!panorama.DeviceGroup || panorama.DeviceGroup === "Not Applicable"}
              >
                <InputLabel id="action-select-label">Select Action</InputLabel>
                <Select
                  labelId="action-select-label"
                  id="action-select"
                  value={panorama.Action}
                  label="Select Action"
                  onChange={(event) =>
                    dispatch(
                      PanoramaPreRuleFieldsAction.SetPanoramaPreRuleFields({
                        ...panorama,
                        Action: event.target.value,
                      })
                    )
                  }
                >
                  <MenuItem value="Allow">Allow</MenuItem>
                  <MenuItem value="Deny">Deny</MenuItem>
                </Select>
              </FormControl>
            </div>
          </Box>
        </div>

        <div className="create-rule__section">
          <Box className="create-rule__input-wrap">
            <button
              type="button"
              onClick={handleSubmitPreRule}
              disabled={submitLoading || !isSubmitEnabled}
              className={`create-rule__button ${
                isSubmitEnabled && !submitLoading
                  ? "create-rule__button--enabled"
                  : "create-rule__button--disabled"
              }`}
            >
              {submitLoading ? "Submitting..." : "Submit Pre-Rule"}
            </button>
          </Box>
          {submitMessage && <p>{submitMessage}</p>}
        </div>
      </div>
    </div>
  );
}