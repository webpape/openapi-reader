# Changelog

All notable changes to this project will be documented in this section.

Version numbers are using **MAJOR**.**MINOR**.**PATCH** numbering format for example 1.2.34

**MAJOR** will be incremented only if there is an incompatible breaking change. New distinct documentation and specification files will be published.

**MINOR** will be incremented only if a function becomes deprecated or deleted (after being deprecated in a previous version)

**PATCH** will be incremented everytime changes and additions are released.

For each version, there will be the list of changes:
* **Breaking Changes** for breaking changes you need to take into consideration before updating.
* **Added** for new features.
* **Changed** for changes in existing functionality.
* **Deprecated** for soon-to-be removed features.
* **Removed** for now removed features.
* **Fixed** for any bug fixes.
* **Security** in case of vulnerabilities.

**Removal lifecycle**<br>
Once a function becomes **Deprecated**, we monitor its usage to track how many users are still using it.
After a long period of time, if a minority of users are still using the function, we might ask users to update to the newer version of the function and give them ample time to do so.
Only after that delay expires (or no more users are still using it), we will have the function **Removed**.

## 1.3.X Releases

### ⚠️ Compatibility Warning

Starting with **version 1.3.0**, several API endpoints have been updated to support a **major enhancement**:
You can now **combine and alternate form steps and signature steps** within the same signing workflow.

This provides greater flexibility, but it also changes how **step numbers** are defined and managed.


* **Endpoints introduced in 1.3.0** (listed below) use the *new step numbering model*.
* **Endpoints from previous versions (≤ 1.2.2)** use the *old step numbering model*.
* These two models are **not compatible** — mixing old and new endpoints within the same implementation could cause inconsistencies.

You may continue using the old routes or migrate fully to the new ones, but **do not mix both** in a single integration.

### Endpoints with Step Numbers (pre-1.3.0)

* GET /1/object/ezsigndocument/{pkiEzsigndocumentID}/getActionableElements
* GET /1/object/ezsigndocument/{pkiEzsigndocumentID}/getCompletedElements
* GET /1/object/ezsigndocument/{pkiEzsigndocumentID}/getEzsignsignatures
* GET /1/object/ezsignfolder/{pkiEzsignfolderID}/getActionableElements
* GET /1/object/ezsignfolder/{pkiEzsignfolderID}/getEzsigndocuments
* GET /1/object/ezsigntemplatedocument/{pkiEzsigntemplatedocumentID}/getEzsigntemplatesignatures
* GET /2/object/ezsigndocument/{pkiEzsigndocumentID}
* GET /3/object/ezsignsignature/{pkiEzsignsignatureID}
* GET /3/object/ezsigntemplatesignature/{pkiEzsigntemplatesignatureID}
* POST /1/object/ezsigndocument/{pkiEzsigndocumentID}/createEzsignelementsPositionedByWord
* POST /1/object/ezsignfolder/{pkiEzsignfolderID}/importEzsigntemplatepackage
* POST /2/object/ezsigntemplatesignature
* POST /3/object/ezsignsignature
* PUT /1/object/ezsigndocument/{pkiEzsigndocumentID}/editEzsignformfieldgroups
* PUT /1/object/ezsigndocument/{pkiEzsigndocumentID}/editEzsignsignatures
* PUT /1/object/ezsigntemplatedocument/{pkiEzsigntemplatedocumentID}/editEzsigntemplatesignatures
* PUT /2/object/ezsignsignature/{pkiEzsignsignatureID}
* PUT /2/object/ezsigntemplatesignature/{pkiEzsigntemplatesignatureID}

### Updated endpoints with Step Numbers (introduced in 1.3.0)

* GET /2/object/ezsigndocument/{pkiEzsigndocumentID}/getActionableElements
* GET /2/object/ezsigndocument/{pkiEzsigndocumentID}/getCompletedElements
* GET /2/object/ezsigndocument/{pkiEzsigndocumentID}/getEzsignsignatures
* GET /2/object/ezsignfolder/{pkiEzsignfolderID}/getActionableElements
* GET /2/object/ezsignfolder/{pkiEzsignfolderID}/getEzsigndocuments
* GET /2/object/ezsigntemplatedocument/{pkiEzsigntemplatedocumentID}/getEzsigntemplatesignatures
* GET /3/object/ezsigndocument/{pkiEzsigndocumentID}
* GET /4/object/ezsignsignature/{pkiEzsignsignatureID}
* GET /4/object/ezsigntemplatesignature/{pkiEzsigntemplatesignatureID}
* POST /2/object/ezsigndocument/{pkiEzsigndocumentID}/createEzsignelementsPositionedByWord
* POST /2/object/ezsignfolder/{pkiEzsignfolderID}/importEzsigntemplatepackage
* POST /3/object/ezsigntemplatesignature
* POST /4/object/ezsignsignature
* PUT /2/object/ezsigndocument/{pkiEzsigndocumentID}/editEzsignformfieldgroups
* PUT /2/object/ezsigndocument/{pkiEzsigndocumentID}/editEzsignsignatures
* PUT /2/object/ezsigntemplatedocument/{pkiEzsigntemplatedocumentID}/editEzsigntemplatesignatures
* PUT /3/object/ezsignsignature/{pkiEzsignsignatureID}
* PUT /3/object/ezsigntemplatesignature/{pkiEzsigntemplatesignatureID}

---

### [1.3.4] - 2026-XX-XX

#### Added
- DELETE /1/object/documenttype/{pkiDocumenttypeID}
- DELETE /1/object/documenttypechecklist/{pkiDocumenttypechecklistID}
- GET /1/object/adjustment/{pkiAdjustmentID}/getAttachments
- GET /1/object/adjustment/{pkiAdjustmentID}/getCommunicationCount
- GET /1/object/adjustment/{pkiAdjustmentID}/getCommunicationList
- GET /1/object/adjustment/{pkiAdjustmentID}/getCommunicationrecipients
- GET /1/object/adjustment/{pkiAdjustmentID}/getCommunicationsenders
- GET /1/object/adjustment/getList
- GET /1/object/adjustmentreminder/getList
- GET /1/object/bankaccount/getList
- GET /1/object/deposit/getList
- GET /1/object/deposittransitcheque/getList
- GET /1/object/disclosure/getList
- GET /1/object/electronicfundstransfer/getList
- GET /1/object/electronicfundstransfertransaction/getList
- GET /1/object/invoice/getList
- GET /1/object/notary/getList
- GET /1/object/officetaxreport/getList
- GET /1/object/purchase/getList
- GET /1/object/salary/getList
- GET /2/module/ezsign/suggestTemplates
- GET /2/object/attachmentrejectreason/getAutocomplete/{sSelector}
- GET /2/object/ezsignbulksenddocumentmapping/{pkiEzsignbulksenddocumentmappingID}
- GET /3/object/ezsignbulksendsignermapping/{pkiEzsignbulksendsignermappingID}
- GET /3/object/ezsigntemplatepackage/{pkiEzsigntemplatepackageID}
- GET /3/object/ezsigntemplatepackagemembership/{pkiEzsigntemplatepackagemembershipID}
- GET /3/object/ezsigntemplatepackagesigner/{pkiEzsigntemplatepackagesignerID}
- GET /3/object/ezsigntemplatesigner/{pkiEzsigntemplatesignerID}
- GET /4/object/ezsignbulksend/{pkiEzsignbulksendID}
- GET /4/object/ezsigntemplate/{pkiEzsigntemplateID}
- GET /1/object/documenttype/getList
- GET /2/object/documenttype/{pkiDocumenttypeID}
- GET /2/object/documenttype/getAutocomplete/{sSelector}
- PUT /2/object/ezsigntemplatepackage/{pkiEzsigntemplatepackageID}/editEzsigntemplatepackagesigners
- PUT /2/object/ezsigntemplatepackagesigner/{pkiEzsigntemplatepackagesignerID}
- PUT /2/object/ezsigntemplatesigner/{pkiEzsigntemplatesignerID}
- PUT /1/object/documenttype/{pkiDocumenttypeID}
- POST /1/object/adjustment/{pkiAdjustmentID}/importIntoEDM
- POST /2/object/ezsignbulksendsignermapping
- POST /2/object/ezsigntemplatepackagesigner
- POST /2/object/ezsigntemplatesigner
- POST /1/object/attachment/{pkiAttachmentID}/delete
- POST /1/object/attachment/{pkiAttachmentID}/rename
- POST /1/object/attachment/{pkiAttachmentID}/restore
- POST /1/object/attachment/{pkiAttachmentID}/validate
- POST /1/object/documenttype
- PATCH /1/object/attachment/{pkiAttachmentID}/setDocumentType
- PATCH /1/object/attachment/{pkiAttachmentID}/setPrivacy
- PATCH /1/object/documenttypechecklist/{pkiDocumenttypechecklistID}
- Selector AttachmentSpecificUser in GET /2/object/user/getAutocomplete/{sSelector}
- Parameter fkiAttachmentID in GET /2/object/user/getAutocomplete/{sSelector}
- Property dtAgentPermitexpiration in agent-ListElement
- Property dtEzsignformfieldgroupCompleted in ezsignformfieldgroup-Response
- Property eEzmaxcaseGooddaytaskstatus in ezmaxcase-Response and ezmaxcase-Listelement
- Property eEzsignfoldersignerassociationRole in ezsignfoldersignerassociation-RequestPatch
- Property fkiAgentID in user-ListElement
- Property fkiBrokerID in user-ListElement
- Property sAttachmentCategory in attachment-Response
- Property objUserSpecific in attachment-Response
- Property eWebhookEzmaxpartnerevent in webhook-sendWebhook-v1-Request
- Enum value 'Optional' for Field-eEzsigntemplatesignatureConsultationtrigger
- Enum value 'CCDeleted' for Field-eEzsignfoldersignerassociationRole
- Enum value 'BuyercontractCreated' for Field-eWebhookRealestateevent
- Enum value 'BuyercontractModified' for Field-eWebhookRealestateevent
- Enum value 'CONFLICT' for Field-eErrorCode
- Enum value 'Pending' for Field-eAttachmentVerified
- Enum value 'Pending' for Field-eAttachmentlogType
- Webhook Buyercontract BuyercontractCreated
- Webhook Buyercontract BuyercontractModified


### [1.3.3] - 2026-07-22

#### Fixed
- Minor structurals changes


### [1.3.2] - 2026-07-21

#### Added
- GET /2/module/ezsign/suggestSigners
- GET /2/object/ezsignfolder/{pkiEzsignfolderID}/getEzsignfoldersignerassociations
- GET /3/object/ezsignfoldersignerassociation/{pkiEzsignfoldersignerassociationID}
- GET /2/object/inscription/{pkiInscriptionID}
- GET /1/object/inscription/{pkiInscriptionID}/getInscriptionnotauthenticateds
- GET /2/object/inscriptionnotauthenticated/{pkiInscriptionnotauthenticatedID}
- POST /2/object/ezsignfoldersignerassociation/{pkiEzsignfoldersignerassociationID}
- POST /3/object/ezsignfoldersignerassociation
- Enum value 'Realestate' for eWebhookModule
- Properties pkiInscriptionbuildingtypeID, sInscriptionbuildingtypeNameX, pkiInscriptioncategoryID, sInscriptioncategoryNameX, iInscriptionUnit in inscription-Listelement
- Properties pkiInscriptionbuildingtypeID, sInscriptionbuildingtypeNameX, pkiInscriptioncategoryID, sInscriptioncategoryNameX, iInscriptionUnit in inscriptionnotauthenticated-Listelement
- Property eAgentSchedule in agent-ListElement
- Property bInscriptionnotauthenticatedDraft in inscriptionnotauthenticated-ListElement
- Webhook Realestate InscriptionCreated
- Webhook Realestate InscriptionModified
- Webhook Realestate InscriptionnotauthenticatedCreated
- Webhook Realestate InscriptionnotauthenticatedModified


### [1.3.1] - 2026-06-17

#### Added
- DELETE /1/object/ezsigntemplateannotation/{pkiEzsigntemplateannotationID}
- GET /1/object/ezmaxpartnerproductstage/{pkiEzmaxpartnerproductstageID}/getEzmaxpartnerproductstagepermissions
- GET /1/object/ezmaxpartnerproductstage/{pkiEzmaxpartnerproductstageID}/getEzmaxpartnerproductstagewebhooks
- GET /1/object/ezmaxmaillinglist/getList
- GET /1/object/ezsigndocument/{pkiEzsigndocumentID}/getActionableElementsForSigner
- GET /1/object/ezsigntemplatedocument/{pkiEzsigntemplatedocumentID}/getEzsigntemplateannotations
- POST /1/object/ezsignfolder/{pkiEzsignfolderID}/duplicate
- POST /1/object/ezsigntemplateannotation
- POST /4/object/ezsignfoldertype
- PUT /1/object/ezsigntemplateannotation/{pkiEzsigntemplateannotationID}
- PUT /1/object/ezsigntemplatedocument/{pkiEzsigntemplatedocumentID}/editEzsigntemplateannotations
- PUT /4/object/ezsignfoldertype/{pkiEzsignfoldertypeID}
- GET /1/object/ezsignfolder/{pkiEzsignfolderID}/getActionableElementsForSigner
- GET /1/object/ezsignfolder/{pkiEzsignfolderID}/getEzsignannotations
- GET /1/object/ezsignfolder/{pkiEzsignfolderID}/getEzsignformfieldgroups
- GET /1/object/ezsignfolder/{pkiEzsignfolderID}/getEzsignsignatures
- GET /2/object/ezsigntemplateannotation/{pkiEzsigntemplateannotationID}
- GET /2/object/ezsigntemplateglobalannotation/{pkiEzsigntemplateglobalannotationID}
- POST /1/module/ezmaxmaillinglist/subscribe
- POST /2/object/ezsigndocument/{pkiEzsigndocumentID}/applyEzsigntemplateglobal
- POST /3/object/ezsigndocument/{pkiEzsigndocumentID}/applyEzsigntemplate
- POST /3/object/ezsignfolder/{pkiEzsignfolderID}/importEzsigntemplatepackage
- Selector AgentBrokerEmployeeEzsignUserNormal in GET /2/object/user/getAutocomplete/{sSelector}
- Properties dtAgentContractdate, dtAgentTransferdate, dtAgentSenioritydate, dtAgentSickleavestart and dtAgentSickleaveend in agent-ListElement
- Properties fkiCountryID and fkiProvinceID in agent-ListElement, broker-ListElement, customer-ListElement, employee-ListElement, inscription-ListElement, inscriptionnotauthenticated-ListElement, rejectedoffertopurchase-ListElement and supplier-ListElement  
- Properties fkiEzsignbulksendID, sEzsignbulksendDescription, fkiEzsignbulksendtransmissionID, sEzsignbulksendtransmissionDescription, fkiEzsigntemplatepublicID, sEzsigntemplatepublicDescription, eEzsignfolderSource in object ezsignfolder-ListElement
- Properties bEzsignfoldertypeSenddocumentmergetoemail, bEzsignfoldertypeSenddocumentmergetoezsignsigner, bEzsignfoldertypeSenddocumentmergetoreceivealldocument and bEzsignfoldertypeSenddocumentmergetouser in ezsignfoldertype-RequestV3 and ezsignfoldertype-ResponseV4
- Property a_objEzsigntemplateannotation in ezsigntemplate-ResponseCompound
- Property a_objEzsigntemplateannotation in ezsigntemplate-ResponseCompoundV3
- Property a_objEzsigntemplateglobalannotation in ezsigntemplateglobal-ResponseCompound
- Property fkiEzmaxpartnerID in user-Response
- Property fkiEzmaxpartnerproductstageID in apikey-ResponseCompound
- Property iEzsignfolderStepcurrent in ezsignfolder-ResponseV3
- Property iEzsignfoldertypeArchivaldays in ezsignfoldertype-getDefaults-v2-Response-mPayload
- Property sBuyercontractContract in buyercontract-ListElement
- Property objInscription in inscriptionnotauthenticated-Response
- Value Optional in Field-eEzsignsignatureConsultationtrigger
- Value Suspended in Field-eSessionhistoryEndby


### [1.3.0] - 2026-01-24

#### Added
- GET /1/object/agent/getList
- GET /1/object/broker/getList
- GET /1/object/buyercontract/getList
- GET /1/object/customer/getList
- GET /1/object/employee/getList
- GET /1/object/ezsignbulksend/{pkiEzsignbulksendID}/getBatchFile
- GET /1/object/ezsignbulksendtransmission/{pkiEzsignbulksendtransmissionID}/getBatchFile
- GET /1/object/ezsigntemplatedocument/{pkiEzsigntemplatedocumentID}/download
- GET /1/object/inscriptiontemp/getList
- GET /1/object/lead/getList
- GET /1/object/otherincome/getList
- GET /1/object/rejectedoffertopurchase/getList
- GET /1/object/supplier/getList
- GET /2/object/agent/getAutocomplete/{sSelector}
- GET /2/object/agenttype/getAutocomplete/{sSelector}
- GET /2/object/broker/getAutocomplete/{sSelector}
- GET /2/object/brokertype/getAutocomplete/{sSelector}
- GET /2/object/ezsigndocument/{pkiEzsigndocumentID}/getActionableElements
- GET /2/object/ezsigndocument/{pkiEzsigndocumentID}/getCompletedElements
- GET /2/object/ezsigndocument/{pkiEzsigndocumentID}/getEzsignsignatures
- GET /2/object/ezsignfolder/{pkiEzsignfolderID}/getActionableElements
- GET /2/object/ezsignfolder/{pkiEzsignfolderID}/getEzsigndocuments
- GET /2/object/ezsigntemplatedocument/{pkiEzsigntemplatedocumentID}/getEzsigntemplatesignatures
- GET /2/object/inscriptionchecklist/getAutocomplete/{sSelector}
- GET /2/object/leadsource/getAutocomplete/{sSelector}
- GET /2/object/notificationtest/{pkiNotificationtestID}/getElements
- GET /2/object/otherincometype/getAutocomplete/{sSelector}
- GET /2/object/paymentmethod/getAutocomplete/{sSelector}
- GET /3/object/ezsigndocument/{pkiEzsigndocumentID}
- GET /3/object/ezsigndocument/{pkiEzsigndocumentID}/getActionableElements
- GET /3/object/ezsignfolder/{pkiEzsignfolderID}/getActionableElements
- GET /4/object/ezsignsignature/{pkiEzsignsignatureID}
- GET /4/object/ezsigntemplatesignature/{pkiEzsigntemplatesignatureID}
- POST /1/module/ezmaxcustomer/createCustomer
- POST /1/object/activesession/setGoal
- POST /1/object/agent/{pkiAgentID}/importIntoEDM
- POST /1/object/broker/{pkiBrokerID}/importIntoEDM
- POST /1/object/buyercontract/{pkiBuyercontractID}/importIntoEDM
- POST /1/object/customer/{pkiCustomerID}/importIntoEDM
- POST /1/object/electronicfundstransfer/{pkiElectronicfundstransferID}/importIntoEDM
- POST /1/object/employee/{pkiEmployeeID}/importIntoEDM
- POST /1/object/externalbroker/{pkiExternalbrokerID}/importIntoEDM
- POST /1/object/inscription/{pkiInscriptionID}/importIntoEDM
- POST /1/object/inscriptionnotauthenticated/{pkiInscriptionnotauthenticatedID}/importIntoEDM
- POST /1/object/inscriptiontemp/{pkiInscriptiontempID}/importIntoEDM
- POST /1/object/invoice/{pkiInvoiceID}/importIntoEDM
- POST /1/object/lead/{pkiLeadID}/importIntoEDM
- POST /1/object/otherincome/{pkiOtherincomeID}/importIntoEDM
- POST /1/object/rejectedoffertopurchase/{pkiRejectedoffertopurchaseID}/importIntoEDM
- POST /1/object/supplier/{pkiSupplierID}/importIntoEDM
- POST /1/object/tranqcontract/{pkiTranqcontractID}/importIntoEDM
- POST /1/report/accountspayable/accountspayable
- POST /1/report/accountsreceivablevscommission/accountsreceivablevscommission
- POST /2/object/ezsigndocument/{pkiEzsigndocumentID}/createEzsignelementsPositionedByWord
- POST /2/object/ezsignfolder/{pkiEzsignfolderID}/importEzsigntemplatepackage
- POST /2/object/ezsignfoldersignerassociation/{pkiEzsignfoldersignerassociationID}/createEmbeddedUrl
- POST /3/object/ezsigntemplatesignature
- POST /4/object/ezsignsignature
- PUT /2/object/ezsigndocument/{pkiEzsigndocumentID}/editEzsignformfieldgroups
- PUT /2/object/ezsigndocument/{pkiEzsigndocumentID}/editEzsignsignatures
- PUT /2/object/ezsigntemplatedocument/{pkiEzsigntemplatedocumentID}/editEzsigntemplatesignatures
- PUT /3/object/ezsignsignature/{pkiEzsignsignatureID}
- PUT /3/object/ezsigntemplatesignature/{pkiEzsigntemplatesignatureID}
- Properties a_objContactPrivate, a_objContactShared in ezsign-suggestSigners-v1-Response-mPayload
- Properties bEzsignfoldertypeSendsignatureattachmentezsignsigner, bEzsignfoldertypeSendsignatureattachment, bEzsignfoldertypeSendsignatureattachmentuser, bEzsignfoldertypeAllowdownloadsignatureattachmentezsignsigner, bEzsignfoldertypeSendsignatureattachmentreceivealldocument in ezsignfoldertype-RequestV3 and- ezsignfoldertype-ResponseV4
- Properties eEzsignsignatureSignaturepadrequired, eEzsignsignatureSignaturepadrequired in ezsignsignature-Request and ezsignsignature-Response
- Properties eEzsigntemplatesignatureSignaturepadrequired, eEzsigntemplatesignatureSignaturepadrequired in ezsigntemplatesignature-Request and ezsigntemplatesignature-Response
- Property a_objEzsignsignaturepaymentdetail in ezsignsignature-RequestCompound
- Property a_objEzsigntemplatesignaturepaymentdetail in ezsigntemplatesignature-RequestCompound, ezsigntemplatesignature-RequestCompoundV2, ezsigntemplatesignature-ResponseCompoundV3
- Property bInscriptionInspection in inscription-ListElement
- Property bInscriptionInspection in inscriptionnotauthenticated-ListElement
- Property bInscriptionnotauthenticatedConditional in inscription-ListElement
- Property bInscriptionnotauthenticatedConditional in inscriptionnotauthenticated-ListElement
- Property bUserAddmeinezsignfolder in activesession-ResponseCompound-User
- Property bUserAddmeinezsignfolder in user-getPreferences-v1-Response
- Property bUserAddmeinezsignfolder in user-setPreferences-v1-Request
- Property dtUserNpsrequest in activesession-ResponseCompound
- Property eEzsignfolderCompletion in ezsignfolder-ListElement
- Property eEzsignfolderDocumentmerge in ezsignfoldertype-RequestV3 and ezsignfoldertype-ResponseV4
- Property eEzsignfolderMessageorder in ezsignfolder-Response
- Property eUserType in ezsignfoldersignerassociation-ResponseCompound-User
- Property fkiDepartmentID in agent-AutocompleteElement-Response
- Property fkiDepartmentID in broker-AutocompleteElement-Response
- Property fkiDepartmentID in customer-AutocompleteElement-Response
- Property fkiEzsigntemplateglobalID in Custom-Ezsignimportdocument-Response
- Property fkiModuleIDForm in user-getPreferences-v1-Response-mPayload
- Property fkiModuleIDForm in user-setPreferences-v1-Request
- Property fkiPaymentgatewayID in ezsignsignature-Response, ezsigntemplatesignature-Request, ezsigntemplatesignature-Response
- Property iUserFrontendgoal in activesession-ResponseCompound-User
- Property iSystemconfigurationEzsignreminderhoursend in systemconfiguration-Request and systemconfiguration-Response
- Property objReportcellstyleCustom in Common-Reportrow
- Property sEzsignsignergroupDescriptionX in Custom-EzsignfoldertransmissionSigner-Response
- Property sEzsigntemplateglobalDescription in Custom-Ezsignimportdocument-Response
- Property sCustomerCode in customer-AutocompleteElement-Response
- Property sModuleNameX in user-getPreferences-v1-Response-mPayload
- Property sReportsectionTabname in Common-Reportsection
- Property sWebhookAuthentificationexternalerror in webhook-ResponseCompound
- Selector EzsignfoldertypeReassign in /2/object/userlogintype/getAutocomplete/{sSelector}
- Value PerEzsignfolderStepSync in eEzsignfolderCompletion
- Value PerEzsignfolderStepSync in eEzsignfoldertypeCompletion
- Value PendingPrematurelyEnded in eEzsigndocumentStep

#### Deprecated
- POST /1/object/ezsignfoldersignerassociation/{pkiEzsignfoldersignerassociationID}/createEmbeddedUrl

#### Removed
- Property bEzsignfolderPaymentused in Custom-EzmaxinvoicingEzsignfolder-Response
- GET /1/object/ezsignfolder/{pkiEzsignfolderID}/getEzsigndocuments
- GET /1/object/ezsigntemplatedocument/{pkiEzsigntemplatedocumentID}/getEzsigntemplatesignatures
- GET /1/object/notificationtest/{pkiNotificationtestID}/getElements
- GET /2/object/inscriptionchecklist/getAutocomplete
- GET /2/object/signature/{pkiSignatureID}
- GET /3/object/ezsignsignature/{pkiEzsignsignatureID}
- GET /3/object/ezsigntemplatesignature/{pkiEzsigntemplatesignatureID} 
- POST /1/object/ezsignfolder/{pkiEzsignfolderID}/reorder
- POST /1/object/ezsignfoldersignerassociation/{pkiEzsignfoldersignerassociationID}/createEmbeddedUrl
- PUT /1/object/ezsignbulksend/{pkiEzsignbulksendID}
- PUT /1/object/systemconfiguration/{pkiSystemconfigurationID}
- PUT /2/object/ezsignsignature/{pkiEzsignsignatureID}
- PUT /2/object/ezsigntemplatesignature/{pkiEzsigntemplatesignatureID}

## Older Releases
Documentation and changelog for older releases can be found here
- [1.2.x Releases Documentation (Full)](https://ezmaxinc.github.io/eZmax-API/docs/full/ezmax.v1.2.html)
- [1.1.x Releases Documentation (Full)](https://ezmaxinc.github.io/eZmax-API/docs/full/ezmax.v1.1.html)
- [1.0.x Releases Documentation (Full)](https://ezmaxinc.github.io/eZmax-API/docs/full/ezmax.v1.0.html)
