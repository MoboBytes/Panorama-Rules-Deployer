import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import type { SelectChangeEvent } from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
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
import NameField from "../components/NameTextField";
import { PanoramaPreRuleFieldsAction } from '../features/IPanoramaPreRuleFields.feature.ts';
import { useAppDispatch, useAppSelector } from '../hook';

export default function CreateARule() {

  const dispatch = useAppDispatch();
  const panorama = useAppSelector((state) => state.PanoramaPreRuleFields.TrackerPanorama);

  const [trafficMode, setTrafficMode] = useState("automatic");

  const [deviceGroups, setDeviceGroups] = useState<string[]>([]);

  const [tags, setTags] = useState<PanoramaTagEntry[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);

  const [applications, setApplications] = useState<PanoramaApplicationEntry[]>(
    []
  );
  const [applicationsLoading, setApplicationsLoading] = useState(false);

  const [services, setServices] = useState<PanoramaServiceEntry[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  const [logForwardingProfilesData, setLogForwardingProfilesData] = useState<
    PanoramaLogForwardingProfileEntry[]
  >([]);

  const [logForwardingProfilesLoading, setLogForwardingProfilesLoading] =
    useState(false);

  const [securityProfileGroups, setSecurityProfileGroups] = useState<
    PanoramaSecurityProfileGroupEntry[]
  >([]);
  const [securityProfileGroupsLoading, setSecurityProfileGroupsLoading] =
    useState(false);
    
  const selectedLogPositions = [
  ...(panorama.LogStart === "yes" ? ["start"] : []),
  ...(panorama.LogEnd === "yes" ? ["end"] : []),
  ];

  const handleDeviceGroupChange = async (event: SelectChangeEvent) => {
    const nextDeviceGroup = event.target.value;

    dispatch(PanoramaPreRuleFieldsAction.SetPanoramaPreRuleFields({ ...panorama, DeviceGroup: nextDeviceGroup }))
    
    setTags([]);
    setApplications([]);
    setServices([]);
    setLogForwardingProfilesData([]);
    setSecurityProfileGroups([]);

    if (!nextDeviceGroup) {
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

      const retrievedApplications =
        await getAllPanoramaApplications(nextDeviceGroup);
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
    
    setDeviceGroups(groups);
    setTags([]);
    setApplications([]);
    setServices([]);
    setLogForwardingProfilesData([]);
    setSecurityProfileGroups([]);

    if (groups.length === 1) {
      const autoSelectedGroup = groups[0];

      dispatch(PanoramaPreRuleFieldsAction.SetPanoramaPreRuleFields({ ...panorama, DeviceGroup: autoSelectedGroup }))

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
      dispatch(PanoramaPreRuleFieldsAction.SetPanoramaPreRuleFields({ ...panorama, DeviceGroup: "" }))
      setSourceDetails(emptyChartDetails);
      setDestDetails(emptyChartDetails);
    }
  };

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

  const logForwardingProfiles: TagOption[] = logForwardingProfilesData.map(
    (profile) => ({
      name: profile.name,
      location: profile.location,
      deviceGroup: profile.deviceGroup,
    })
  );

  const selectedLogProfile =
  logForwardingProfiles.find(
    (profile) => profile.name === panorama.LogSetting
  ) ?? null;

  const profileSettingOptions: TagOption[] = securityProfileGroups.map(
    (profileGroup) => ({
      name: profileGroup.name,
      location: profileGroup.location,
    })
  );

//MultipleSelectCheckmarks Components: --------------------------------------------------------------------------
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

//SingleSelectCheckmark Components: --------------------------------------------------------------------------------
const selectedProfileSetting =
  profileSettingOptions.find((profile) => profile.name === panorama.ProfileSetting) ?? null;
const selectedGroupTag = tags.find((tag) => tag.name === panorama.GroupTag) ?? null;

//Automatically Generated Fields: -------------------------------------------------------------------------------------
const generatedRuleName = [panorama.To, panorama.SourceName, "to", panorama.DestinationName, panorama.TicketNumber].filter(Boolean).join("-");
const generatedDescription = ["Ticket:",panorama.TicketNumber,"Requestor:",panorama.Requester,"Purpose: To allow",panorama.SourceName,"to connect to",panorama.DestinationName,"using",panorama.Application,"on",panorama.Service,].filter(Boolean).join(" ");

useEffect(() => {
  if (trafficMode !== "automatic") return;

  if (panorama.RuleName === generatedRuleName && panorama.Description === generatedDescription) return;

  dispatch(PanoramaPreRuleFieldsAction.SetPanoramaPreRuleFields({
    ...panorama,
    RuleName: generatedRuleName,
    Description: generatedDescription,
  }));
}, [trafficMode, generatedRuleName, generatedDescription, panorama, dispatch]);

//IP2Zone Fields: ---------------------------------------------------------------------------------------------------------------
const emptyChartDetails = {
  firewallHostname: "",
  firewallSerialNumber: "",
  zone: "",
  firewallGroup: "",
};

const [sourceDetails, setSourceDetails] = useState(emptyChartDetails);
const [destDetails, setDestDetails] = useState(emptyChartDetails);

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
        <div className="create-rule__section">
          <div className="create-rule__section-header">
            <p className="IPSubtitle">
              How do you want to define the traffic for this rule?
            </p>
          </div>

          <Box className="create-rule__radio-wrap">
            <FormControl fullWidth>
              <RadioGroup
                aria-labelledby="traffic-mode-radio-group"
                name="traffic-mode-radio-group"
                value={trafficMode}
                onChange={(e) => setTrafficMode(e.target.value)}
                className="AnswerBoxes"
              >
                <FormControlLabel
                  className="RadioButtons"
                  value="automatic"
                  control={<Radio />}
                  label="Automatic"
                />
                <FormControlLabel
                  className="RadioButtons"
                  value="manual"
                  control={<Radio />}
                  label="Manual"
                />
              </RadioGroup>
            </FormControl>
          </Box>
        </div>

        <TicketNumber
          value={panorama.TicketNumber}
          onChange={(value) => dispatch(PanoramaPreRuleFieldsAction.SetPanoramaPreRuleFields({...panorama, TicketNumber: value,}))}
        />

        <NameField
          value={panorama.Requester}
          onChange={(value) => dispatch(PanoramaPreRuleFieldsAction.SetPanoramaPreRuleFields({...panorama, Requester: value,}))}
          title="Requester"
          label="Enter Requester Name"
        />

        <div className="create-rule__section">
          <div className="create-rule__section-header">
            <p className="IPSubtitle">Rule Name</p>
          </div>

          <Box className="create-rule__input-wrap">
            <TextField
              fullWidth
              value={panorama.RuleName}
              onChange={(e) => dispatch(PanoramaPreRuleFieldsAction.SetPanoramaPreRuleFields({ ...panorama, RuleName: e.target.value }))}
              className="create-rule__input"
              label="Enter Rule Name"
              variant="outlined"
              disabled={trafficMode !== "manual"}
            />
          </Box>
        </div>

        <div className="create-rule__section">
          <div className="create-rule__section-header">
            <p className="IPSubtitle">Description</p>
          </div>

          <Box className="create-rule__input-wrap">
            <TextField
              fullWidth
              multiline
              minRows={3}
              value={panorama.Description}
              onChange={(e) => dispatch(PanoramaPreRuleFieldsAction.SetPanoramaPreRuleFields({ ...panorama, Description: e.target.value }))}
              className="create-rule__input"
              label="Enter Description"
              variant="outlined"
              disabled={trafficMode !== "manual"}
            />
          </Box>
        </div>

        {trafficMode === "automatic" && (
          <>
            <div className="IP2ZoneWrapper">
              <IP2Zone
                sourceIp={panorama.Source}
                onSourceIpChange={(value) => dispatch(PanoramaPreRuleFieldsAction.SetPanoramaPreRuleFields({ ...panorama, Source: value }))}
                sourceIpName={panorama.SourceName}
                onSourceIpNameChange={(value) => dispatch(PanoramaPreRuleFieldsAction.SetPanoramaPreRuleFields({ ...panorama, SourceName: value }))}
                sourceDetails={sourceDetails}
                onSourceDetailsChange={(value) => {setSourceDetails(value); dispatch(PanoramaPreRuleFieldsAction.SetPanoramaPreRuleFields({ ...panorama, From: value.zone }));}}
                destIp={panorama.Destination}
                onDestIpChange={(value) => dispatch(PanoramaPreRuleFieldsAction.SetPanoramaPreRuleFields({ ...panorama, Destination: value }))}
                destIpName={panorama.DestinationName}
                onDestIpNameChange={(value) => dispatch(PanoramaPreRuleFieldsAction.SetPanoramaPreRuleFields({ ...panorama, DestinationName: value }))}
                destDetails={destDetails}
                onDestDetailsChange={(value) => {setDestDetails(value); dispatch(PanoramaPreRuleFieldsAction.SetPanoramaPreRuleFields({ ...panorama, To: value.zone }));}}
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
                    <InputLabel id="device-group-select-label">
                      Select Device Group
                    </InputLabel>
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
                  value = {selectedApplicationOptions}
                  onChange={(value) => dispatch(PanoramaPreRuleFieldsAction.SetPanoramaPreRuleFields({...panorama,Application: value.map((v) => v.name).join(", "),}))}
                  disabled={!panorama.DeviceGroup || applicationsLoading}
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
                  onChange ={(value) => dispatch(PanoramaPreRuleFieldsAction.SetPanoramaPreRuleFields({...panorama,Service: value.map((v) => v.name).join(", "),}))}
                  disabled={!panorama.DeviceGroup || servicesLoading}
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
                  onChange ={(value) => dispatch(PanoramaPreRuleFieldsAction.SetPanoramaPreRuleFields({...panorama,Tag: value.map((v) => v.name).join(", "),}))}
                  disabled={!panorama.DeviceGroup || tagsLoading}
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
                  disabled={!panorama.DeviceGroup || tagsLoading}
                  value={selectedGroupTag}
                  onChange={(value) => dispatch(PanoramaPreRuleFieldsAction.SetPanoramaPreRuleFields({...panorama,GroupTag: value?.name ?? "",}))}
                />
              </Box>
            </div>

            <div className="create-rule__section">
              <Box className="create-rule__input-wrap create-rule__log-profile-start-end">
                <LogProfileStartEnd
                  tagOptions={logForwardingProfiles}
                  selectedTag={selectedLogProfile}
                  onTagChange={(value) => dispatch(PanoramaPreRuleFieldsAction.SetPanoramaPreRuleFields({...panorama,LogSetting: value?.name ?? "",}))}
                  selectedPositions={selectedLogPositions}
                  onPositionChange={()=>{}}
                  onLogPositionChange={(value) => dispatch(PanoramaPreRuleFieldsAction.SetPanoramaPreRuleFields({...panorama,LogStart: value.logStart,LogEnd: value.logEnd,}))}
                  tagDisabled={!panorama.DeviceGroup || logForwardingProfilesLoading}
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
                  disabled={!panorama.DeviceGroup || securityProfileGroupsLoading}
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
                  <FormControl fullWidth disabled={!panorama.DeviceGroup}>
                    <InputLabel id="action-select-label">
                      Select Action
                    </InputLabel>
                    <Select
                      labelId="action-select-label"
                      id="action-select"
                      value={panorama.Action}
                      label="Select Action"
                      onChange={(event) => dispatch(
                        PanoramaPreRuleFieldsAction.SetPanoramaPreRuleFields({
                          ...panorama,
                          Action: event.target.value
                        })
                      )}
                    >
                      <MenuItem value="Allow">Allow</MenuItem>
                      <MenuItem value="Deny">Deny</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </Box>
            </div>
          </>
        )}
      </div>
    </div>
  );
}