import React from "react";
import Input from "./Input";
import PasswordInput from "./PasswordInput";
import TextArea from "./TextArea";
import Button from "./Button";

const Form = React.forwardRef(({
  fields = [],
  columns = [],
  gridClassName = "grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8",
  fieldsClassName = "space-y-4 sm:space-y-5",
  onSubmit,
  submitText = "Submit",
  isLoading = false,
  showSubmitButton = true,
  buttons,
  className = "",
  children,
  ...props
}, ref) => {

  const renderField = (field) => {
    if (!field) return null;

    if (field.render) {
      return <React.Fragment key={field.name}>{field.render(field)}</React.Fragment>;
    }

    if (field.type === "fieldset") {
      return (
        <fieldset
          key={field.legend || field.name}
          className={field.className || "border-2 border-gray-300 rounded-xl p-3 sm:p-4 space-y-4"}
        >
          {field.legend && (
            <legend className="text-sm sm:text-base font-semibold m-0 px-2">{field.legend}</legend>
          )}
          {field.renderBody ? (
            field.renderBody(field)
          ) : (
            field.fields?.map(renderField)
          )}
        </fieldset>
      );
    }

    if (field.type === "textarea") {
      return (
        <TextArea
          key={field.name}
          id={field.name}
          name={field.name}
          label={field.label}
          error={field.error}
          required={field.required}
          value={field.value}
          onChange={field.onChange}
          placeholder={field.placeholder}
          {...field.inputProps}
        />
      );
    }

    if (field.type === "password") {
      return (
        <PasswordInput
          key={field.name}
          id={field.name}
          name={field.name}
          label={field.label}
          error={field.error}
          required={field.required}
          value={field.value}
          onChange={field.onChange}
          placeholder={field.placeholder}
          {...field.inputProps}
        />
      );
    }

    if (field.type === "select") {
      const selectId = field.name || (field.label ? field.label.toLowerCase().replace(/\s+/g, "-") : undefined);
      return (
        <div key={field.name} className="w-full relative">
          {field.label && (
            <label
              htmlFor={selectId}
              className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2"
            >
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
          )}
          <div className="relative">
            {field.leftIcon && (
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                {field.leftIcon}
              </div>
            )}
            <select
              id={selectId}
              name={field.name}
              value={field.value}
              onChange={field.onChange}
              className={`w-full py-3 bg-gray-50 border-2 rounded-xl transition-all outline-none appearance-none pr-10
                ${field.leftIcon ? "pl-11" : "pl-4"}
                ${field.error
                  ? "border-red-500 bg-red-50/30 focus:border-red-500"
                  : "border-gray-300 focus:border-amber-400 focus:bg-white"
                }
                ${field.inputClassName || ""}`}
              {...field.inputProps}
            >
              {field.placeholder && <option value="">{field.placeholder}</option>}
              {field.options?.map((opt) => {
                const optVal = typeof opt === "object" ? opt.value : opt;
                const optLabel = typeof opt === "object" ? opt.label : opt;
                return (
                  <option key={optVal} value={optVal}>
                    {optLabel}
                  </option>
                );
              })}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {field.error && (
            <p className="mt-1.5 text-xs font-bold text-red-500 uppercase tracking-wider">
              {field.error}
            </p>
          )}
        </div>
      );
    }

    return (
      <Input
        key={field.name}
        id={field.name}
        name={field.name}
        label={field.label}
        type={field.type || "text"}
        error={field.error}
        required={field.required}
        leftIcon={field.leftIcon}
        value={field.value}
        onChange={field.onChange}
        placeholder={field.placeholder}
        {...field.inputProps}
      />
    );
  };

  return (
    <form
      ref={ref}
      onSubmit={onSubmit}
      className={className}
      {...props}
    >
      <div className={fieldsClassName}>
        {columns.length > 0 ? (
          <div className={gridClassName}>
            {columns.map((col, colIdx) => (
              <div key={colIdx} className={col.className || "flex flex-col space-y-4 sm:space-y-5"}>
                {col.fields?.map(renderField)}
              </div>
            ))}
          </div>
        ) : (
          fields.map(renderField)
        )}
      </div>

      {children}

      {showSubmitButton && !buttons && (
        <div className="mt-6">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isLoading}
            className="w-full"
          >
            {submitText}
          </Button>
        </div>
      )}

      {buttons && <div className="mt-6">{buttons}</div>}
    </form>
  );
});

Form.displayName = "Form";

export default Form;
