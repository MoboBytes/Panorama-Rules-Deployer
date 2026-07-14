import { useState } from "react";
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

export default function CreateARule() {
  const [trafficMode, setTrafficMode] = useState("automatic");
  const [ruleName, setRuleName] = useState("");
  const [ticketNumber, setTicketNumber] = useState("");
  const [requesterName, setRequesterName] = useState("");
  const [description, setDescription] = useState("");

  const [deviceGroups, setDeviceGroups] = useState<string[]>([]);
  const [selectedDeviceGroup, setSelectedDeviceGroup] = useState("");

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

  const [selectedLogProfile, setSelectedLogProfile] =
    useState<TagOption | null>(null);
  const [selectedLogPositions, setSelectedLogPositions] = useState<string[]>([
    "end",
  ]);

  const [selectedAction, setSelectedAction] = useState("Allow");

  const handleDeviceGroupChange = async (event: SelectChangeEvent) => {
    const nextDeviceGroup = event.target.value;
    setSelectedDeviceGroup(nextDeviceGroup);
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
      setSelectedDeviceGroup(autoSelectedGroup);

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
      setSelectedDeviceGroup("");
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

  const profileSettingOptions: TagOption[] = securityProfileGroups.map(
    (profileGroup) => ({
      name: profileGroup.name,
      location: profileGroup.location,
    })
  );

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
          value={ticketNumber}
          onChange={setTicketNumber}
        />

        <NameField
          value={requesterName}
          onChange={setRequesterName}
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
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              <IP2Zone onLookupComplete={handleLookupComplete} />
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
                      value={selectedDeviceGroup}
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
                  disabled={!selectedDeviceGroup || applicationsLoading}
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
                  disabled={!selectedDeviceGroup || servicesLoading}
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
                  disabled={!selectedDeviceGroup || tagsLoading}
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
                  disabled={!selectedDeviceGroup || tagsLoading}
                />
              </Box>
            </div>

            <div className="create-rule__section">
              <Box className="create-rule__input-wrap create-rule__log-profile-start-end">
                <LogProfileStartEnd
                  tagOptions={logForwardingProfiles}
                  selectedTag={selectedLogProfile}
                  onTagChange={setSelectedLogProfile}
                  selectedPositions={selectedLogPositions}
                  onPositionChange={setSelectedLogPositions}
                  tagDisabled={
                    !selectedDeviceGroup || logForwardingProfilesLoading
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
                  disabled={!selectedDeviceGroup || securityProfileGroupsLoading}
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
                  <FormControl fullWidth disabled={!selectedDeviceGroup}>
                    <InputLabel id="action-select-label">
                      Select Action
                    </InputLabel>
                    <Select
                      labelId="action-select-label"
                      id="action-select"
                      value={selectedAction}
                      label="Select Action"
                      onChange={(event) => setSelectedAction(event.target.value)}
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