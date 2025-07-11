/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifndef HERMES_CDP_DEBUGGERDOMAINAGENT_H
#define HERMES_CDP_DEBUGGERDOMAINAGENT_H

#include <functional>
#include <string>

#include <hermes/AsyncDebuggerAPI.h>
#include <hermes/cdp/MessageConverters.h>
#include <hermes/hermes.h>

#include "DomainAgent.h"
#include "DomainState.h"

namespace facebook {
namespace hermes {
namespace cdp {

enum class PausedNotificationReason;

/// Last explicit debugger step command issued by the user.
enum class LastUserStepRequest {
  StepInto,
  StepOver,
  StepOut,
};

namespace m = ::facebook::hermes::cdp::message;

/// Details about a single Hermes breakpoint, implied by a CDP breakpoint.
struct HermesBreakpoint {
  debugger::BreakpointID breakpointID;
  debugger::ScriptID scriptID;
};

/// Type used to store CDP breakpoint identifiers. These IDs are generated by
/// the CDP Handler, so we can constrain them to a specific range.
using CDPBreakpointID = uint32_t;

/// Description of where breakpoints should be created.
struct CDPBreakpointDescription : public StateValue {
  ~CDPBreakpointDescription() override = default;
  std::unique_ptr<StateValue> copy() const override {
    auto value = std::make_unique<CDPBreakpointDescription>();
    value->line = line;
    value->column = column;
    value->condition = condition;
    value->url = url;
    return value;
  }

  /// Determines whether this breakpoint can be persisted across sessions
  bool persistable() const {
    // Only persist breakpoints that can apply to future scripts (i.e.
    // breakpoints set on a set of files specified by script URL, not
    // breakpoints set on an exact, session-specific script ID).
    return url.has_value();
  }

  std::optional<std::string> url;
  long long line;
  std::optional<long long> column;
  std::optional<std::string> condition;
};

/// Details of each existing CDP breakpoint, which may correspond to multiple
/// Hermes breakpoints.
struct CDPBreakpoint {
  explicit CDPBreakpoint(CDPBreakpointDescription description)
      : description(description) {}

  // Description of where the breakpoint should be applied
  CDPBreakpointDescription description;

  // Registered breakpoints in Hermes
  std::vector<HermesBreakpoint> hermesBreakpoints;
};

struct HermesBreakpointLocation {
  debugger::BreakpointID id;
  debugger::SourceLocation location;
};

/// Handler for the "Debugger" domain of CDP. Accepts events from the runtime,
/// and CDP requests from the debug client belonging to the "Debugger" domain.
/// Produces CDP responses and events belonging to the "Debugger" domain. All
/// methods expect to be invoked with exclusive access to the runtime.
class DebuggerDomainAgent : public DomainAgent {
 public:
  DebuggerDomainAgent(
      int32_t executionContextID,
      HermesRuntime &runtime,
      debugger::AsyncDebuggerAPI &asyncDebugger,
      SynchronizedOutboundCallback messageCallback,
      std::shared_ptr<RemoteObjectsTable> objTable_,
      DomainState &state);
  ~DebuggerDomainAgent();

  /// Enables the Debugger domain without processing CDP message or sending a
  /// CDP response. It will still send CDP notifications if needed.
  void enable();
  /// Handles Debugger.enable request
  /// @cdp Debugger.enable If domain is already enabled, will return success.
  void enable(const m::debugger::EnableRequest &req);
  /// Handles Debugger.disable request
  /// @cdp Debugger.disable If domain is already disabled, will return success.
  void disable(const m::debugger::DisableRequest &req);

  /// Handles Debugger.pause request
  void pause(const m::debugger::PauseRequest &req);
  /// Handles Debugger.resume request
  void resume(const m::debugger::ResumeRequest &req);

  /// Handles Debugger.stepInto request
  void stepInto(const m::debugger::StepIntoRequest &req);
  /// Handles Debugger.stepOut request
  void stepOut(const m::debugger::StepOutRequest &req);
  /// Handles Debugger.stepOver request
  void stepOver(const m::debugger::StepOverRequest &req);

  /// Handles Debugger.setBlackboxedRanges request
  void setBlackboxedRanges(const m::debugger::SetBlackboxedRangesRequest &req);
  /// Handles Debugger.setBlackboxPatterns request
  void setBlackboxPatterns(const m::debugger::SetBlackboxPatternsRequest &req);
  /// Handles Debugger.setPauseOnExceptions
  void setPauseOnExceptions(
      const m::debugger::SetPauseOnExceptionsRequest &req);

  /// Handles Debugger.evaluateOnCallFrame
  void evaluateOnCallFrame(const m::debugger::EvaluateOnCallFrameRequest &req);

  /// Debugger.setBreakpoint creates a CDP breakpoint that applies to exactly
  /// one script (identified by script ID) that does not survive reloads.
  void setBreakpoint(const m::debugger::SetBreakpointRequest &req);
  // Debugger.setBreakpointByUrl creates a CDP breakpoint that may apply to
  // multiple scripts (identified by URL), and survives reloads.
  void setBreakpointByUrl(const m::debugger::SetBreakpointByUrlRequest &req);
  /// Handles Debugger.removeBreakpoint
  void removeBreakpoint(const m::debugger::RemoveBreakpointRequest &req);
  /// Handles Debugger.setBreakpointsActive
  /// @cdp Debugger.setBreakpointsActive Allowed even if domain is not enabled.
  void setBreakpointsActive(
      const m::debugger::SetBreakpointsActiveRequest &req);

 private:
  /// Handle an event originating from the runtime.
  void handleDebuggerEvent(
      HermesRuntime &runtime,
      debugger::AsyncDebuggerAPI &asyncDebugger,
      debugger::DebuggerEventType event);

  /// Send a Debugger.paused notification to the debug client
  void sendPausedNotificationToClient(PausedNotificationReason reason);
  /// Send a Debugger.scriptParsed notification to the debug client
  void sendScriptParsedNotificationToClient(
      const debugger::SourceLocation srcLoc);

  /// Obtain the newly loaded script and send a ScriptParsed notification to the
  /// debug client
  void processNewLoadedScript();

  std::pair<unsigned int, CDPBreakpoint &> createCDPBreakpoint(
      CDPBreakpointDescription &&description,
      std::optional<HermesBreakpoint> hermesBreakpoint = std::nullopt);

  std::optional<HermesBreakpointLocation> createHermesBreakpoint(
      debugger::ScriptID scriptID,
      const CDPBreakpointDescription &description);

  std::optional<HermesBreakpointLocation> applyBreakpoint(
      CDPBreakpoint &breakpoint,
      debugger::ScriptID scriptID);

  /// Holds a boolean that determines if scripts without a script url
  /// (e.g. anonymous scripts) should be blackboxed.
  /// Same as V8:
  /// https://source.chromium.org/chromium/chromium/src/+/fef5d519bab86dbd712d76bfca5be90a6e03459c:v8/src/inspector/v8-debugger-agent-impl.cc;l=997-999
  bool blackboxAnonymousScripts_ = false;
  /// Optionally, holds a compiled regex pattern that is used to test if
  /// script urls should be blackboxed.
  /// See isLocationBlackboxed below for more details. Same as V8:
  /// https://source.chromium.org/chromium/chromium/src/+/fef5d519bab86dbd712d76bfca5be90a6e03459c:v8/src/inspector/v8-debugger-agent-impl.cc;l=993-996
  /// Matching using the compiled regex should be done with
  /// ::hermes::regex::searchWithBytecode.
  std::optional<std::vector<uint8_t>> compiledBlackboxPatternRegex_;

  /// A vector of 1-based positions per script id indicating where blackbox
  /// state changes using [from inclusive, to exclusive) pairs.
  /// [  (start)   ... position[0]) range is not blackboxed
  /// [position[0] ... position[1]) range is blackboxed
  /// [position[1] ... position[2]) range is not blackboxed ... ...
  /// [position[n] ...    (end)   ) range is blackboxed if n is even, not
  /// blackboxed if odd.
  /// This is used to determine if the debugger is paused on one of these
  /// blackboxed ranges, to prevent the user from stopping there in the
  /// following scenarios:
  /// 1. Step out- repeats stepping out until reaches a non-blackboxed range.
  /// 2. Step over- stepping over to a blackboxed range meaning that
  /// the next un-blackboxed range would be after all the stepping in the
  /// function are done (because blackboxing is per file, meaning per function
  /// as well) so we can execute step out as well in this case until we
  /// step out of blackboxed ranges.
  /// Comparing with v8, we don’t check if the user comes from a blackboxed
  /// range, but only if a stepover got you to a blackboxed range. However
  /// both results in the same thing which is stepping out until reaching a
  /// non-blackboxed range.
  /// 3. Step into- execute another step into.
  /// Repeat this step until outside of a blackboxed range.
  /// 4. Exceptions triggering the debugger pause-
  /// (uncaught or if the user chooses to stop on all exceptions)-
  /// ignore and continue execution
  /// 5. Debugger statements- ignore and continue execution
  /// 6. Explicit pause- keep stepping in until reaching a non-blackboxed range
  /// 7. Manual breakpoints- allow stopping in blackboxed ranges
  std::unordered_map<debugger::ScriptID, std::vector<std::pair<int, int>>>
      blackboxedRanges_;
  /// Checks whether the passed location falls within a blackboxed range
  /// in blackboxedRanges_.
  /// Chrome looks at full functions ("frames") to detemine this. See:
  /// https://source.chromium.org/chromium/chromium/src/+/318e9cfd9fbbbc70906f6a78d017a2708248dc6d:v8/src/inspector/v8-debugger-agent-impl.cc;l=984-1026
  /// We, on the other hand, look at individual lines since there's no
  /// difference in practise because the current way functions are blackboxed is
  /// by using ignoreList in source maps, which blackboxes full files, which
  /// means also it blackboxes full functions, so there's no difference between
  /// checking if a line in a function is blackboxed or if the whole function is
  /// blackboxed.
  /// This means that we receive one "Debugger.setBlackboxedRanges" per bundle
  /// file comprised of source js files.
  /// For each file appearing in the "ignoreList" in source maps, we receive the
  /// start positions and end positions of the file inside the bundle file:
  /// [ file 1 start position,
  ///   file 1 end position,
  ///   file 2 start position,
  ///   file 2 end position,
  ///   ... ]
  bool isLocationBlackboxed(
      debugger::ScriptID scriptID,
      std::string scriptName,
      int lineNumber,
      int columnNumber);
  /// Checks whether the location of the top frame of the call stack is
  /// blackboxed or not using isLocationBlackboxed
  bool isTopFrameLocationBlackboxed();

  bool checkDebuggerEnabled(const m::Request &req);
  bool checkDebuggerPaused(const m::Request &req);

  /// Removes any modifications this agent made to Hermes in order to enable
  /// debugging
  void cleanUp();

  HermesRuntime &runtime_;
  debugger::AsyncDebuggerAPI &asyncDebugger_;

  /// ID for the registered DebuggerEventCallback
  debugger::DebuggerEventCallbackID debuggerEventCallbackId_;

  /// Details of each CDP breakpoint that has been created, and not
  /// yet destroyed.
  std::unordered_map<CDPBreakpointID, CDPBreakpoint> cdpBreakpoints_{};

  /// CDP breakpoint IDs are assigned by the DebuggerDomainAgent. Keep track of
  /// the next available ID. Starts with 100 to avoid confusion with Hermes
  /// breakpoints IDs that start with 1.
  CDPBreakpointID nextBreakpointID_ = 100;

  DomainState &state_;

  /// Whether the currently installed breakpoints actually take effect. If
  /// they're supposed to be inactive, then debugger agent will automatically
  /// resume execution when breakpoints are hit.
  bool breakpointsActive_ = true;

  /// Whether Debugger.enable was received and wasn't disabled by receiving
  /// Debugger.disable
  bool enabled_;

  /// Whether to consider the debugger as currently paused. There are some
  /// debugger events such as ScriptLoaded where we don't consider the debugger
  /// to be paused.
  /// Should only be set using setPaused and setUnpaused.
  bool paused_;

  /// Called when the runtime is paused.
  void setPaused(PausedNotificationReason pausedNotificationReason);

  /// Called when the runtime is resumed.
  void setUnpaused();

  /// Set to true when the user selects to explicitly pause execution.
  /// This is set back to false when the execution is paused.
  bool explicitPausePending_ = false;

  /// Last explicit step type issued by the user.
  /// * This is never reset because cdp can't tell if a step command was
  /// completed since a step command that does not result in further operations
  /// resolves to a "resume" without "stepFinished" or debugger pause.
  /// That means that this member should only be used in situations where we are
  /// sure that a step command was issued in the given scenario. For example, a
  /// step into command followed by a resume would leave this member holding an
  /// "StepInto" even when minutes later the execution stops on a breakpoint.
  std::optional<LastUserStepRequest> lastUserStepRequest_ = std::nullopt;
};

} // namespace cdp
} // namespace hermes
} // namespace facebook

#endif // HERMES_CDP_DEBUGGERDOMAINAGENT_H
