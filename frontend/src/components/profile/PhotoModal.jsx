import { useEffect, useRef, useState } from 'react';
import Button from '../ui/Button';
import { LoadingState } from '../ui/Feedback';
import { showAuthAlert } from '../auth/authPresentation';
import { uploadPhoto } from '../../services/profileService';
import { saveStyle, cancelStyle } from './ProfileSettings';

// The official crop frame is 220/280 of the preview, exported as 512px WEBP.
export function cropGeometry(image, size, zoom, x, y) {
  const frameSize = (size * 220) / 280,
    frameStart = (size - frameSize) / 2;
  const width = image.naturalWidth * zoom,
    height = image.naturalHeight * zoom;
  const limitX = Math.max(0, (width - frameSize) / 2),
    limitY = Math.max(0, (height - frameSize) / 2);
  const safeX = Math.min(limitX, Math.max(-limitX, x)),
    safeY = Math.min(limitY, Math.max(-limitY, y));
  return {
    frameSize,
    frameStart,
    width,
    height,
    x: safeX,
    y: safeY,
    drawX: (size - width) / 2 + safeX,
    drawY: (size - height) / 2 + safeY
  };
}
export default function PhotoModal({ close, reload }) {
  const canvas = useRef(null),
    stage = useRef(null),
    url = useRef(''),
    file = useRef(null),
    drag = useRef(null);
  const [image, setImage] = useState(null),
    [crop, setCrop] = useState({ zoom: 1, min: 1, x: 0, y: 0 }),
    [busy, setBusy] = useState(false),
    [dragging, setDragging] = useState(false);
  const opener = useRef(document.activeElement);
  useEffect(() => {
    const original = opener.current;
    return () => {
      if (url.current) URL.revokeObjectURL(url.current);
      if (original?.isConnected) original.focus();
    };
  }, []);
  function reset(value = image) {
    if (!value) return;
    const size = Math.round(stage.current?.getBoundingClientRect().width || 280);
    const min = Math.max(
      (size * 220) / 280 / value.naturalWidth,
      (size * 220) / 280 / value.naturalHeight
    );
    setCrop({ zoom: min, min, x: 0, y: 0 });
  }
  useEffect(() => {
    const resize = () => reset();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [image]);
  useEffect(() => {
    if (!image || !canvas.current) return;
    const size = Math.round(stage.current.getBoundingClientRect().width || 280);
    canvas.current.width = size;
    canvas.current.height = size;
    const ctx = canvas.current.getContext('2d', { alpha: false });
    ctx.fillStyle = '#0b1220';
    ctx.fillRect(0, 0, size, size);
    const rect = cropGeometry(image, size, crop.zoom, crop.x, crop.y);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, rect.drawX, rect.drawY, rect.width, rect.height);
  }, [image, crop]);
  useEffect(() => {
    const element = stage.current;
    if (!element || !image) return;
    const wheel = (event) => {
      event.preventDefault();
      setCrop((previous) => ({
        ...previous,
        zoom: Math.min(
          previous.min * 3,
          Math.max(
            previous.min,
            previous.zoom + (event.deltaY > 0 ? -1 : 1) * Math.max(previous.min * 0.08, 0.01)
          )
        )
      }));
    };
    element.addEventListener('wheel', wheel, { passive: false });
    return () => element.removeEventListener('wheel', wheel);
  }, [image]);
  async function select(event) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith('image/')) {
      await showAuthAlert({
        icon: 'warning',
        title: 'Arquivo inválido',
        text: 'Escolha uma imagem válida para usar como foto de perfil.',
        confirmText: 'Fechar'
      });
      event.target.value = '';
      return;
    }
    if (url.current) URL.revokeObjectURL(url.current);
    url.current = URL.createObjectURL(selected);
    const loaded = new Image();
    loaded.onload = () => {
      setImage(loaded);
    };
    loaded.onerror = () =>
      showAuthAlert({
        icon: 'error',
        title: 'Erro ao atualizar foto',
        text: 'Não foi possível carregar a imagem.',
        confirmText: 'Fechar'
      });
    loaded.src = url.current;
  }
  useEffect(() => {
    reset();
  }, [image]);
  async function save(event) {
    event.preventDefault();
    if (!image || !file.current?.files.length) {
      await showAuthAlert({
        icon: 'warning',
        title: 'Escolha uma imagem',
        text: 'Selecione uma foto antes de salvar.',
        confirmText: 'Fechar'
      });
      return;
    }
    setBusy(true);
    try {
      const rect = cropGeometry(image, canvas.current.width, crop.zoom, crop.x, crop.y),
        output = document.createElement('canvas');
      output.width = 512;
      output.height = 512;
      const ctx = output.getContext('2d'),
        scale = 512 / rect.frameSize;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(
        image,
        (rect.drawX - rect.frameStart) * scale,
        (rect.drawY - rect.frameStart) * scale,
        rect.width * scale,
        rect.height * scale
      );
      const blob = await new Promise((resolve, reject) =>
        output.toBlob(
          (value) =>
            value
              ? resolve(value)
              : reject(new Error('Não foi possível gerar a imagem recortada.')),
          'image/webp',
          0.92
        )
      );
      const result = await uploadPhoto(blob);
      close();
      await reload();
      await showAuthAlert({
        icon: 'success',
        title: 'Foto atualizada!',
        text: result.mensagem || 'Sua foto foi atualizada com sucesso.',
        confirmText: 'Continuar'
      });
    } catch (error) {
      await showAuthAlert({
        icon: 'error',
        title: 'Erro ao atualizar foto',
        text: error.message || 'Não foi possível atualizar sua foto agora.',
        confirmText: 'Fechar'
      });
    } finally {
      setBusy(false);
    }
  }
  function move(event) {
    if (!drag.current) return;
    const rect = cropGeometry(
      image,
      canvas.current.width,
      crop.zoom,
      drag.current.x + event.clientX - drag.current.startX,
      drag.current.y + event.clientY - drag.current.startY
    );
    setCrop((previous) => ({ ...previous, x: rect.x, y: rect.y }));
  }
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-title"
      className="fixed inset-0 z-[20000] grid overflow-y-auto bg-black/65 p-5 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) close();
      }}
    >
      <div className="relative m-auto w-full max-w-[520px] rounded-[24px] border border-[#94a3b8]/18 bg-white p-[30px] shadow-2xl legacy-max-520:p-5 dark:bg-[#0b1424] dark:text-workly-dark-text">
        <Button
          appearance="custom"
          aria-label="Fechar modal"
          autoFocus
          onClick={close}
          disabled={busy}
          className="absolute top-[14px] right-[14px] grid h-9 w-9 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-workly-primary"
        >
          <i aria-hidden="true" className="fas fa-xmark" />
        </Button>
        <h2 id="photo-title" className="mb-2 pr-8 text-2xl font-bold">
          Alterar foto de perfil
        </h2>
        <p className="mb-5 text-[#64748b] dark:text-[#a9b9cf]">
          Escolha uma imagem, ajuste o enquadramento e salve sua nova foto.
        </p>
        <form onSubmit={save} noValidate>
          {!image && (
            <div className="mb-5 grid place-items-center gap-3 rounded-[18px] border border-dashed border-[#94a3b8]/35 p-7 text-center">
              <i aria-hidden="true" className="fas fa-image text-3xl text-workly-primary" />
              <strong>Nenhuma imagem selecionada</strong>
              <span>O recorte e o zoom aparecem depois que você escolher uma nova foto.</span>
            </div>
          )}
          {image && (
            <>
              <div
                ref={stage}
                className={`relative mx-auto mb-5 aspect-square w-[280px] max-w-full touch-none overflow-hidden bg-[#0b1220] ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                onPointerDown={(event) => {
                  event.preventDefault();
                  const rect = cropGeometry(image, canvas.current.width, crop.zoom, crop.x, crop.y);
                  drag.current = {
                    startX: event.clientX,
                    startY: event.clientY,
                    x: rect.x,
                    y: rect.y
                  };
                  setDragging(true);
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={move}
                onPointerUp={(event) => {
                  drag.current = null;
                  setDragging(false);
                  event.currentTarget.releasePointerCapture(event.pointerId);
                }}
                onPointerCancel={() => {
                  drag.current = null;
                  setDragging(false);
                }}
              >
                <canvas
                  ref={canvas}
                  aria-label="Área de recorte da foto"
                  className="block h-full w-full"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-[10.7142857%] rounded-full border-2 border-white shadow-[0_0_0_200px_rgba(0,0,0,0.55)]"
                />
              </div>
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <label htmlFor="photo-zoom">Zoom</label>
                <input
                  id="photo-zoom"
                  type="range"
                  min={crop.min}
                  max={crop.min * 3}
                  step="any"
                  value={crop.zoom}
                  onChange={(event) =>
                    setCrop((previous) => ({ ...previous, zoom: Number(event.target.value) }))
                  }
                  className="min-w-0 flex-1 accent-workly-primary"
                />
                <Button appearance="custom" className={cancelStyle} onClick={() => reset()}>
                  Centralizar
                </Button>
              </div>
              <p className="mb-5 text-sm text-[#64748b]">
                <i aria-hidden="true" className="fas fa-hand-pointer" /> Arraste a imagem para
                enquadrar e use o zoom se precisar aproximar.
              </p>
            </>
          )}
          <label
            htmlFor="nova_foto"
            className="mb-3 inline-flex cursor-pointer items-center gap-2 text-workly-primary"
          >
            <i aria-hidden="true" className="fas fa-upload" /> Escolher imagem
          </label>
          <input
            ref={file}
            id="nova_foto"
            name="nova_foto"
            type="file"
            accept="image/*"
            required
            onChange={select}
            className="block w-full min-w-0 text-sm"
          />
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Button
              type="submit"
              appearance="custom"
              className={saveStyle}
              disabled={!image || busy}
            >
              Salvar foto
            </Button>
            <Button appearance="custom" className={cancelStyle} disabled={busy} onClick={close}>
              Cancelar
            </Button>
          </div>
          {busy && <LoadingState inline message="Salvando..." />}
        </form>
      </div>
    </div>
  );
}
