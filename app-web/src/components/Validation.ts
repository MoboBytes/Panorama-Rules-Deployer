import type { IPanoramaPreRuleFields } from "../contracts/IPanoramaPreRuleFields";

const isFilled = (value: string): boolean => value.trim().length > 0;

export const getMissingPanoramaPreRuleFields = (
  panorama: IPanoramaPreRuleFields
): (keyof IPanoramaPreRuleFields)[] => {
  const requiredFields: (keyof IPanoramaPreRuleFields)[] = [
    "ProfileSetting",
    "Application",
    "Service",
    "GroupTag",
    "Tag",
    "Action",
    "LogSetting",
    "LogStart",
    "LogEnd",
    "DeviceGroup",
    "Requester",
    "TicketNumber",
    "SourceName",
    "DestinationName",
    "To",
    "From",
    "Source",
    "Destination",
    "RuleName",
    "Description",
  ];

  return requiredFields.filter((field) => !isFilled(panorama[field]));
};

export const isPanoramaPreRuleValid = (
  panorama: IPanoramaPreRuleFields
): boolean => {
  return getMissingPanoramaPreRuleFields(panorama).length === 0;
};