"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Power, Settings, Droplets, Sun, ChevronUp, ChevronDown } from "lucide-react";

export function ControlPanel() {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleAction = async (actionId: string, endpoint: string, payload: any = {}) => {
    setLoadingAction(actionId);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      toast.success(data.message || 'Action successful');
    } catch (err: any) {
      toast.error(err.message || 'Failed to execute action');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleFlush = () => {
    const modal = document.getElementById('flush_modal') as HTMLDialogElement;
    if (modal) modal.showModal();
  };

  const executeFlush = () => {
    handleAction('flush', '/api/actuators/pump', { command: 'ON' });
  };

  return (
    <>
      <div className="card bg-base-100 shadow-xl w-full">
        <div className="card-body p-6">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-base-200">
            <h2 className="card-title flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Manual Controls
            </h2>
            <div className="badge badge-error gap-1 uppercase tracking-wide font-semibold">
              Overrides Active
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <button 
              className={`btn btn-lg h-24 ${loadingAction === 'lid_open' ? 'btn-disabled' : 'btn-outline border-base-300 hover:border-primary hover:bg-primary/10 hover:text-primary transition-all'}`}
              onClick={() => handleAction('lid_open', '/api/actuators/lid/open')}
            >
              <div className="flex flex-col items-center gap-2">
                {loadingAction === 'lid_open' ? <span className="loading loading-spinner"></span> : <ChevronUp className="w-6 h-6" />}
                <span>Open Lid</span>
              </div>
            </button>

            <button 
              className={`btn btn-lg h-24 ${loadingAction === 'lid_close' ? 'btn-disabled' : 'btn-outline border-base-300 hover:border-primary hover:bg-primary/10 hover:text-primary transition-all'}`}
              onClick={() => handleAction('lid_close', '/api/actuators/lid/close')}
            >
              <div className="flex flex-col items-center gap-2">
                {loadingAction === 'lid_close' ? <span className="loading loading-spinner"></span> : <ChevronDown className="w-6 h-6" />}
                <span>Close Lid</span>
              </div>
            </button>

            <button 
              className={`btn btn-info shadow-sm btn-lg h-24 text-white hover:btn-active ${loadingAction === 'flush' ? 'btn-disabled' : ''}`}
              onClick={handleFlush}
            >
              <div className="flex flex-col items-center gap-2">
                 {loadingAction === 'flush' ? <span className="loading loading-spinner"></span> : <Droplets className="w-6 h-6" />}
                 <span>Manual Flush</span>
              </div>
            </button>

            <button 
              className={`btn btn-accent shadow-sm btn-lg h-24 text-white hover:btn-active ${loadingAction === 'uv' ? 'btn-disabled' : ''}`}
              onClick={() => handleAction('uv', '/api/actuators/uv', { command: 'ON' })}
            >
              <div className="flex flex-col items-center gap-2">
                 {loadingAction === 'uv' ? <span className="loading loading-spinner"></span> : <Sun className="w-6 h-6" />}
                 <span>Activate UV</span>
              </div>
            </button>

          </div>

          <div className="divider my-6">Danger Zone</div>
          
          <button 
            className={`btn btn-error btn-outline w-full ${loadingAction === 'reset' ? 'btn-disabled' : ''}`}
            onClick={() => {
               const modal = document.getElementById('reset_modal') as HTMLDialogElement;
               if (modal) modal.showModal();
            }}
          >
            {loadingAction === 'reset' ? <span className="loading loading-spinner"></span> : <Power className="w-4 h-4 mr-2" />}
            System Reset
          </button>
        </div>
      </div>

      {/* Flush Confirmation Modal */}
      <dialog id="flush_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="font-bold text-lg text-info flex items-center gap-2">
            <Droplets className="w-5 h-5" />
            Confirm Manual Flush
          </h3>
          <p className="py-4">Are you sure you want to initiate a manual flush cycle? This will override current automation schedules.</p>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-ghost mr-2">Cancel</button>
              <button className="btn btn-info text-white" onClick={executeFlush}>Proceed</button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      {/* Reset Confirmation Modal */}
      <dialog id="reset_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box border-x-4 border-error">
          <h3 className="font-bold text-lg text-error flex items-center gap-2">
            <Power className="w-5 h-5" />
            System Restart Required
          </h3>
          <p className="py-4">Warning: This will reboot the main controller and temporarily sever the connection. Are you sure you wish to proceed?</p>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-ghost mr-2">Cancel</button>
              <button className="btn btn-error text-white" onClick={() => {
                toast.error("Executing emergency reset...");
                setLoadingAction('reset');
                setTimeout(() => setLoadingAction(null), 3000);
              }}>Execute Reset</button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
}
